import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ShiftsRepository } from './shifts.repository';
import { EmployersRepository } from '../employers/employers.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@zivara/shared';
import type { CreateShiftDto } from './dto/create-shift.dto';
import type { CancelShiftDto } from './dto/cancel-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly shiftsRepo: ShiftsRepository,
    private readonly employersRepo: EmployersRepository,
    private readonly professionalsRepo: ProfessionalsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Employer: create and manage ─────────────────────────────────────────

  async createShift(userId: string, dto: CreateShiftDto) {
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    const professional = await this.professionalsRepo.findById(dto.professionalId);
    if (!professional) throw new NotFoundException('Professional not found.');

    const shift = await this.shiftsRepo.create({
      employerId: employer.id,
      professionalId: dto.professionalId,
      applicationId: dto.applicationId ?? null,
      shiftDate: dto.shiftDate,
      startTime: dto.startTime + ':00',
      endTime: dto.endTime + ':00',
      location: dto.location,
      roleDescription: dto.roleDescription,
      status: 'scheduled',
    });

    // Notify professional — shift assigned
    await this.notificationsService.send(professional.userId, NotificationType.ShiftAssigned, {
      referenceType: 'shift',
      referenceId: shift.id,
    });

    return shift;
  }

  async listMyShiftsAsEmployer(userId: string) {
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');
    return this.shiftsRepo.listByEmployer(employer.id);
  }

  // ─── Professional: confirm / cancel ──────────────────────────────────────

  async confirmShift(userId: string, shiftId: string) {
    const shift = await this.assertProfessionalOwnership(userId, shiftId);

    if (shift.status !== 'scheduled') {
      throw new BadRequestException('Only scheduled shifts can be confirmed.');
    }

    const updated = await this.shiftsRepo.update(shiftId, {
      status: 'confirmed',
      professionalConfirmedAt: new Date(),
    });

    // Notify employer
    const employer = await this.employersRepo.findById(shift.employerId);
    if (employer) {
      await this.notificationsService.send(employer.ownerUserId, NotificationType.ShiftConfirmed, {
        referenceType: 'shift',
        referenceId: shiftId,
      });
    }

    return updated;
  }

  async cancelShift(userId: string, shiftId: string, dto: CancelShiftDto) {
    const shift = await this.shiftsRepo.findById(shiftId);
    if (!shift) throw new NotFoundException('Shift not found.');

    // Either the employer or the professional can cancel
    const professional = await this.professionalsRepo.findByUserId(userId);
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);

    const isProfessional = professional && shift.professionalId === professional.id;
    const isEmployer = employer && shift.employerId === employer.id;

    if (!isProfessional && !isEmployer) {
      throw new ForbiddenException('You do not have permission to cancel this shift.');
    }

    if (['completed', 'cancelled'].includes(shift.status)) {
      throw new BadRequestException('This shift cannot be cancelled in its current state.');
    }

    const updated = await this.shiftsRepo.update(shiftId, {
      status: 'cancelled',
      cancelledBy: userId,
      cancellationReason: dto.reason,
    });

    // Notify the other party
    if (isProfessional && employer) {
      await this.notificationsService.send(employer.ownerUserId, NotificationType.ShiftCancelled, {
        referenceType: 'shift', referenceId: shiftId,
      });
    } else if (isEmployer && professional) {
      await this.notificationsService.send(professional.userId, NotificationType.ShiftCancelled, {
        referenceType: 'shift', referenceId: shiftId,
      });
    }

    return updated;
  }

  // ─── Completion confirmation (Correctness Property 7) ────────────────────

  async confirmCompletion(userId: string, shiftId: string) {
    const shift = await this.shiftsRepo.findById(shiftId);
    if (!shift) throw new NotFoundException('Shift not found.');

    if (!['scheduled', 'confirmed'].includes(shift.status)) {
      throw new BadRequestException('This shift cannot be marked as completed in its current state.');
    }

    const professional = await this.professionalsRepo.findByUserId(userId);
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);

    const isProfessional = professional && shift.professionalId === professional.id;
    const isEmployer = employer && shift.employerId === employer.id;

    if (!isProfessional && !isEmployer) {
      throw new ForbiddenException('You do not have permission to confirm this shift.');
    }

    const updateData: Partial<typeof shift> = {};
    if (isProfessional) updateData['professionalConfirmedCompletion'] = true;
    if (isEmployer) updateData['employerConfirmedCompletion'] = true;

    // Check if BOTH sides confirmed after this update
    const employerConfirmed = isEmployer || shift.employerConfirmedCompletion;
    const professionalConfirmed = isProfessional || shift.professionalConfirmedCompletion;

    if (employerConfirmed && professionalConfirmed) {
      // Correctness Property 7: status = completed ONLY when both confirm
      updateData['status'] = 'completed';
    }

    const updated = await this.shiftsRepo.update(shiftId, updateData as Parameters<typeof this.shiftsRepo.update>[1]);

    if (updated.status === 'completed') {
      // Prompt both parties to rate — payment initiation handled by Payments module
      if (professional) {
        await this.notificationsService.send(professional.userId, NotificationType.ShiftCompletionPrompt, {
          referenceType: 'shift', referenceId: shiftId,
        });
      }
      if (employer) {
        await this.notificationsService.send(employer.ownerUserId, NotificationType.ShiftCompletionPrompt, {
          referenceType: 'shift', referenceId: shiftId,
        });
      }
    }

    return updated;
  }

  async raiseDispute(userId: string, shiftId: string) {
    const shift = await this.shiftsRepo.findById(shiftId);
    if (!shift) throw new NotFoundException('Shift not found.');

    const professional = await this.professionalsRepo.findByUserId(userId);
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);

    const canDispute =
      (professional && shift.professionalId === professional.id) ||
      (employer && shift.employerId === employer.id);

    if (!canDispute) throw new ForbiddenException('You cannot dispute this shift.');

    if (shift.status !== 'completed') {
      throw new BadRequestException('Only completed shifts can be disputed.');
    }

    return this.shiftsRepo.update(shiftId, { status: 'disputed' });
  }

  // ─── Professional: view shifts ────────────────────────────────────────────

  async listMyShiftsAsProfessional(userId: string) {
    const professional = await this.professionalsRepo.findByUserId(userId);
    if (!professional) throw new NotFoundException('Professional profile not found.');

    const all = await this.shiftsRepo.listByProfessional(professional.id);
    const today = new Date().toISOString().split('T')[0]!;

    return {
      upcoming: all.filter((s) => s.shiftDate >= today && !['cancelled', 'completed'].includes(s.status)),
      active: all.filter((s) => s.status === 'confirmed' && s.shiftDate === today),
      past: all.filter((s) => s.shiftDate < today || ['completed', 'cancelled'].includes(s.status)),
    };
  }

  // ─── Shared ───────────────────────────────────────────────────────────────

  async getShift(userId: string, shiftId: string) {
    const shift = await this.shiftsRepo.findById(shiftId);
    if (!shift) throw new NotFoundException('Shift not found.');

    const professional = await this.professionalsRepo.findByUserId(userId);
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);

    const canView =
      (professional && shift.professionalId === professional.id) ||
      (employer && shift.employerId === employer.id);

    if (!canView) throw new ForbiddenException('You do not have access to this shift.');
    return shift;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async assertProfessionalOwnership(userId: string, shiftId: string) {
    const shift = await this.shiftsRepo.findById(shiftId);
    if (!shift) throw new NotFoundException('Shift not found.');

    const professional = await this.professionalsRepo.findByUserId(userId);
    if (!professional || shift.professionalId !== professional.id) {
      throw new ForbiddenException('You do not have permission to manage this shift.');
    }
    return shift;
  }
}
