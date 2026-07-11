import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationType } from '@zivara/shared';

const mockRepo = {
  create: jest.fn(),
  listByUser: jest.fn(),
  countUnread: jest.fn(),
  markRead: jest.fn(),
  markAllRead: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepo.create.mockResolvedValue({ id: 'notif-1' });
    mockRepo.countUnread.mockResolvedValue(0);
    mockRepo.listByUser.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  // ─── Content accuracy ─────────────────────────────────────────────────────

  describe('send — content accuracy (Correctness Property 1)', () => {
    it('sends ApplicationShortlisted with shortlisted-specific title and body', async () => {
      await service.send('user-1', NotificationType.ApplicationShortlisted, {
        referenceType: 'application', referenceId: 'app-1',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.ApplicationShortlisted,
          title: expect.objectContaining({ en: expect.stringContaining('shortlisted') as string }),
          isRead: false,
        }),
      );
    });

    it('sends ApplicationRejected with rejected-specific title — NOT shortlisted content', async () => {
      await service.send('user-1', NotificationType.ApplicationRejected, {
        referenceType: 'application', referenceId: 'app-1',
      });

      const call = (mockRepo.create as jest.Mock).mock.calls[0][0] as {
        type: string;
        title: Record<string, string>;
        body: Record<string, string>;
      };

      expect(call.type).toBe(NotificationType.ApplicationRejected);
      // Must not contain shortlisted language
      const titleEn = call.title['en'] ?? '';
      const bodyEn = call.body['en'] ?? '';
      expect(titleEn.toLowerCase()).not.toContain('shortlist');
      expect(bodyEn.toLowerCase()).not.toContain('shortlist');
    });

    it('sends ApplicationHired with hired-specific content — NOT shortlisted content', async () => {
      await service.send('user-1', NotificationType.ApplicationHired, {
        referenceType: 'application', referenceId: 'app-1',
      });

      const call = (mockRepo.create as jest.Mock).mock.calls[0][0] as {
        type: string;
        title: Record<string, string>;
      };

      expect(call.type).toBe(NotificationType.ApplicationHired);
      const titleEn = call.title['en'] ?? '';
      expect(titleEn.toLowerCase()).not.toContain('shortlist');
    });

    it('includes both EN and AR content for all notification types', async () => {
      const typesToCheck = [
        NotificationType.ApplicationReceived,
        NotificationType.ApplicationShortlisted,
        NotificationType.ApplicationRejected,
        NotificationType.ApplicationHired,
        NotificationType.ShiftAssigned,
        NotificationType.PaymentProcessed,
        NotificationType.VerificationApproved,
        NotificationType.AccountSuspended,
      ];

      for (const type of typesToCheck) {
        jest.clearAllMocks();
        mockRepo.create.mockResolvedValue({ id: 'n' });

        await service.send('user-1', type);

        const call = (mockRepo.create as jest.Mock).mock.calls[0][0] as {
          title: Record<string, string>;
          body: Record<string, string>;
        };

        expect(call.title['en'], `Missing EN title for ${type}`).toBeTruthy();
        expect(call.title['ar'], `Missing AR title for ${type}`).toBeTruthy();
        expect(call.body['en'], `Missing EN body for ${type}`).toBeTruthy();
        expect(call.body['ar'], `Missing AR body for ${type}`).toBeTruthy();
      }
    });

    it('stores referenceType and referenceId when provided', async () => {
      await service.send('user-1', NotificationType.ShiftAssigned, {
        referenceType: 'shift',
        referenceId: 'shift-99',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceType: 'shift',
          referenceId: 'shift-99',
        }),
      );
    });

    it('stores null referenceType and referenceId when not provided', async () => {
      await service.send('user-1', NotificationType.AccountSuspended);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceType: null,
          referenceId: null,
        }),
      );
    });
  });

  // ─── Read management ──────────────────────────────────────────────────────

  describe('getMyNotifications', () => {
    it('returns notifications and unread count', async () => {
      mockRepo.listByUser.mockResolvedValue([{ id: 'n-1', isRead: false }]);
      mockRepo.countUnread.mockResolvedValue(3);

      const result = await service.getMyNotifications('user-1');

      expect(result.data).toHaveLength(1);
      expect(result.unreadCount).toBe(3);
    });
  });

  describe('markRead', () => {
    it('calls repository with correct user and notification id', async () => {
      mockRepo.markRead.mockResolvedValue(undefined);
      await service.markRead('user-1', 'notif-99');
      expect(mockRepo.markRead).toHaveBeenCalledWith('notif-99', 'user-1');
    });
  });

  describe('markAllRead', () => {
    it('calls repository markAllRead for the user', async () => {
      mockRepo.markAllRead.mockResolvedValue(undefined);
      await service.markAllRead('user-1');
      expect(mockRepo.markAllRead).toHaveBeenCalledWith('user-1');
    });
  });
});
