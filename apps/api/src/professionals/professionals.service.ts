import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ProfessionalsRepository } from './professionals.repository';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { AddExperienceDto } from './dto/add-experience.dto';
import type { UpdateExperienceDto } from './dto/update-experience.dto';
import type { AddSkillDto } from './dto/add-skill.dto';

/**
 * Completeness score breakdown (totals 100):
 *   fullName           15
 *   phone              10
 *   bio                10
 *   profilePhotoUrl    10
 *   primaryIndustry    10
 *   city + country     10
 *   ≥1 skill           15
 *   ≥1 experience      15
 *   nationality set     5
 */
function computeScore(
  profile: {
    fullName: string | null;
    phone: string | null;
    bio: string | null;
    profilePhotoUrl: string | null;
    primaryIndustry: string | null;
    currentCity: string | null;
    currentCountry: string | null;
    nationality: string | null;
  },
  skillCount: number,
  experienceCount: number,
): number {
  let score = 0;
  if (profile.fullName) score += 15;
  if (profile.phone) score += 10;
  if (profile.bio) score += 10;
  if (profile.profilePhotoUrl) score += 10;
  if (profile.primaryIndustry) score += 10;
  if (profile.currentCity && profile.currentCountry) score += 10;
  if (skillCount >= 1) score += 15;
  if (experienceCount >= 1) score += 15;
  if (profile.nationality) score += 5;
  return Math.min(score, 100);
}

/** Profile response — never exposes government_id_hash */
export interface ProfileResponse {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  nationality: string | null;
  showNationality: boolean;
  countryOfOrigin: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  primaryIndustry: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  isProfilePublic: boolean;
  verificationStatus: string;
  profileCompleteness: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Public profile — omits nationality if show_nationality = false */
export interface PublicProfileResponse extends Omit<ProfileResponse, 'userId' | 'showNationality' | 'countryOfOrigin'> {
  nationality: string | null; // null when show_nationality=false
}

function toProfileResponse(row: {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  nationality: string | null;
  showNationality: boolean;
  countryOfOrigin: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  primaryIndustry: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  isProfilePublic: boolean;
  verificationStatus: string;
  profileCompleteness: number;
  governmentIdHash: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProfileResponse {
  return {
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    phone: row.phone,
    nationality: row.nationality,
    showNationality: row.showNationality,
    countryOfOrigin: row.countryOfOrigin,
    currentCity: row.currentCity,
    currentCountry: row.currentCountry,
    primaryIndustry: row.primaryIndustry,
    bio: row.bio,
    profilePhotoUrl: row.profilePhotoUrl,
    isProfilePublic: row.isProfilePublic,
    verificationStatus: row.verificationStatus,
    profileCompleteness: row.profileCompleteness,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class ProfessionalsService {
  constructor(private readonly repository: ProfessionalsRepository) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getMyProfile(userId: string): Promise<ProfileResponse & {
    experience: Awaited<ReturnType<ProfessionalsRepository['listExperience']>>;
    skills: Awaited<ReturnType<ProfessionalsRepository['listSkills']>>;
  }> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');

    const [experience, skills] = await Promise.all([
      this.repository.listExperience(profile.id),
      this.repository.listSkills(profile.id),
    ]);

    return { ...toProfileResponse(profile), experience, skills };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');

    await this.repository.updateProfile(profile.id, dto);

    // Recompute completeness after every update
    await this.recomputeCompleteness(profile.id);
    const refreshed = await this.repository.findById(profile.id);
    return toProfileResponse(refreshed!);
  }

  async setProfileVisibility(userId: string, isPublic: boolean): Promise<ProfileResponse> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');

    const updated = await this.repository.updateProfile(profile.id, {
      isProfilePublic: isPublic,
    });
    return toProfileResponse(updated);
  }

  async getPublicProfile(id: string): Promise<PublicProfileResponse & {
    experience: Awaited<ReturnType<ProfessionalsRepository['listExperience']>>;
    skills: Awaited<ReturnType<ProfessionalsRepository['listSkills']>>;
  }> {
    const profile = await this.repository.findById(id);
    if (!profile || !profile.isProfilePublic) {
      throw new NotFoundException('Profile not found.');
    }

    const [experience, skills] = await Promise.all([
      this.repository.listExperience(profile.id),
      this.repository.listSkills(profile.id),
    ]);

    const base = toProfileResponse(profile);
    return {
      id: base.id,
      fullName: base.fullName,
      phone: base.phone,
      // Only expose nationality if the professional opted in
      nationality: base.showNationality ? base.nationality : null,
      currentCity: base.currentCity,
      currentCountry: base.currentCountry,
      primaryIndustry: base.primaryIndustry,
      bio: base.bio,
      profilePhotoUrl: base.profilePhotoUrl,
      isProfilePublic: base.isProfilePublic,
      verificationStatus: base.verificationStatus,
      profileCompleteness: base.profileCompleteness,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      experience,
      skills,
    };
  }

  // ─── Experience ───────────────────────────────────────────────────────────

  async addExperience(userId: string, dto: AddExperienceDto) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');

    const exp = await this.repository.addExperience({
      professionalId: profile.id,
      jobTitle: dto.jobTitle,
      companyName: dto.companyName,
      industry: dto.industry ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      description: dto.description ?? null,
    });

    await this.recomputeCompleteness(profile.id);
    return exp;
  }

  async updateExperience(
    userId: string,
    experienceId: string,
    dto: UpdateExperienceDto,
  ) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');

    const exp = await this.repository.findExperienceById(experienceId);
    if (!exp) throw new NotFoundException('Experience not found.');
    if (exp.professionalId !== profile.id) {
      throw new ForbiddenException('You do not have permission to edit this experience.');
    }

    return this.repository.updateExperience(experienceId, dto);
  }

  async deleteExperience(userId: string, experienceId: string): Promise<void> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');

    const exp = await this.repository.findExperienceById(experienceId);
    if (!exp) throw new NotFoundException('Experience not found.');
    if (exp.professionalId !== profile.id) {
      throw new ForbiddenException('You do not have permission to delete this experience.');
    }

    await this.repository.deleteExperience(experienceId);
    await this.recomputeCompleteness(profile.id);
  }

  // ─── Skills ───────────────────────────────────────────────────────────────

  async addSkill(userId: string, dto: AddSkillDto) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');

    const skill = await this.repository.addSkill({
      professionalId: profile.id,
      skillName: dto.skillName,
      yearsExperience: dto.yearsExperience ?? null,
    });

    await this.recomputeCompleteness(profile.id);
    return skill;
  }

  async deleteSkill(userId: string, skillId: string): Promise<void> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');

    const skill = await this.repository.findSkillById(skillId);
    if (!skill) throw new NotFoundException('Skill not found.');
    if (skill.professionalId !== profile.id) {
      throw new ForbiddenException('You do not have permission to delete this skill.');
    }

    await this.repository.deleteSkill(skillId);
    await this.recomputeCompleteness(profile.id);
  }

  async listSkills(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Professional profile not found.');
    return this.repository.listSkills(profile.id);
  }

  // ─── Completeness ─────────────────────────────────────────────────────────

  async recomputeCompleteness(professionalId: string): Promise<number> {
    const [profile, skillCount, experienceCount] = await Promise.all([
      this.repository.findById(professionalId),
      this.repository.countSkills(professionalId),
      this.repository.countExperience(professionalId),
    ]);

    if (!profile) return 0;

    const score = computeScore(profile, skillCount, experienceCount);
    await this.repository.updateProfile(professionalId, { profileCompleteness: score });
    return score;
  }
}
