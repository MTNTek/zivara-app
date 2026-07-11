import { Injectable } from '@nestjs/common';
import { NotificationType } from '@zivara/shared';
import { NotificationsRepository } from './notifications.repository';

/**
 * Notification content map.
 * Every NotificationType MUST have a corresponding entry here.
 * This is the single source of truth for what each notification says —
 * preventing accidental mismatches between type and message.
 *
 * Correctness Property 1: The content here MUST match the type name exactly.
 * A shortlisted notification can only have type = ApplicationShortlisted.
 */
const NOTIFICATION_CONTENT: Record<
  NotificationType,
  { title: Record<string, string>; body: Record<string, string> }
> = {
  [NotificationType.ApplicationReceived]: {
    title: { en: 'Application submitted', ar: 'تم تقديم الطلب' },
    body: { en: 'Your application has been received and will be reviewed shortly.', ar: 'تم استلام طلبك وسيتم مراجعته قريبًا.' },
  },
  [NotificationType.ApplicationUnderReview]: {
    title: { en: 'Application under review', ar: 'طلبك قيد المراجعة' },
    body: { en: 'The employer is currently reviewing your application.', ar: 'يقوم صاحب العمل حاليًا بمراجعة طلبك.' },
  },
  [NotificationType.ApplicationShortlisted]: {
    title: { en: "You've been shortlisted", ar: 'تم إدراجك في القائمة المختصرة' },
    body: { en: 'Great news! The employer has shortlisted you for this position.', ar: 'أخبار رائعة! لقد أدرجك صاحب العمل في القائمة المختصرة لهذا المنصب.' },
  },
  [NotificationType.ApplicationRejected]: {
    title: { en: 'Application update', ar: 'تحديث حالة الطلب' },
    body: { en: 'Thank you for your interest. Unfortunately the employer has decided not to proceed with your application at this time.', ar: 'شكرًا على اهتمامك. للأسف، قرر صاحب العمل عدم المضي قدمًا في طلبك في الوقت الحالي.' },
  },
  [NotificationType.ApplicationHired]: {
    title: { en: "Congratulations — you're hired!", ar: 'تهانينا — لقد تم قبولك!' },
    body: { en: 'The employer has selected you for this position. They will be in touch with next steps.', ar: 'اختارك صاحب العمل لهذا المنصب. سيتواصلون معك قريبًا.' },
  },
  [NotificationType.ApplicationWithdrawn]: {
    title: { en: 'Application withdrawn', ar: 'تم سحب الطلب' },
    body: { en: 'Your application has been successfully withdrawn.', ar: 'تم سحب طلبك بنجاح.' },
  },
  [NotificationType.ShiftAssigned]: {
    title: { en: 'New shift assigned', ar: 'تم تعيين وردية جديدة' },
    body: { en: 'You have been assigned a new shift. Please review the details and confirm.', ar: 'تم تعيينك لوردية جديدة. يرجى مراجعة التفاصيل والتأكيد.' },
  },
  [NotificationType.ShiftConfirmed]: {
    title: { en: 'Shift confirmed', ar: 'تم تأكيد الوردية' },
    body: { en: 'The professional has confirmed the shift.', ar: 'أكد المحترف الوردية.' },
  },
  [NotificationType.ShiftCancelled]: {
    title: { en: 'Shift cancelled', ar: 'تم إلغاء الوردية' },
    body: { en: 'A shift has been cancelled. Please check your schedule.', ar: 'تم إلغاء وردية. يرجى مراجعة جدولك.' },
  },
  [NotificationType.ShiftCompletionPrompt]: {
    title: { en: 'Please confirm shift completion', ar: 'يرجى تأكيد إتمام الوردية' },
    body: { en: 'Please confirm that the shift has been completed so payment can be processed.', ar: 'يرجى تأكيد إتمام الوردية حتى يمكن معالجة الدفع.' },
  },
  [NotificationType.PaymentProcessed]: {
    title: { en: 'Payment processed', ar: 'تمت معالجة الدفع' },
    body: { en: 'Your payment has been processed successfully.', ar: 'تمت معالجة دفعتك بنجاح.' },
  },
  [NotificationType.PaymentFailed]: {
    title: { en: 'Payment failed', ar: 'فشل الدفع' },
    body: { en: 'There was an issue processing your payment. Please check your account details.', ar: 'حدثت مشكلة أثناء معالجة دفعتك. يرجى مراجعة تفاصيل حسابك.' },
  },
  [NotificationType.RatingReceived]: {
    title: { en: 'You received a rating', ar: 'لقد تلقيت تقييمًا' },
    body: { en: 'Someone has left a rating on your profile.', ar: 'قام شخص ما بترك تقييم على ملفك الشخصي.' },
  },
  [NotificationType.VerificationApproved]: {
    title: { en: 'Verification approved', ar: 'تمت الموافقة على التحقق' },
    body: { en: 'Your account has been verified. Your verified badge is now visible on your profile.', ar: 'تم التحقق من حسابك. شارة التحقق الخاصة بك مرئية الآن على ملفك الشخصي.' },
  },
  [NotificationType.VerificationRejected]: {
    title: { en: 'Verification update', ar: 'تحديث التحقق' },
    body: { en: 'We were unable to verify your account with the submitted documents. Please upload updated documents.', ar: 'لم نتمكن من التحقق من حسابك باستخدام المستندات المقدمة. يرجى رفع مستندات محدثة.' },
  },
  [NotificationType.AccountSuspended]: {
    title: { en: 'Account suspended', ar: 'تم تعليق الحساب' },
    body: { en: 'Your account has been suspended. Please contact support for assistance.', ar: 'تم تعليق حسابك. يرجى التواصل مع الدعم للمساعدة.' },
  },
  [NotificationType.SavedSearchMatch]: {
    title: { en: 'New job matches your search', ar: 'وظيفة جديدة تتطابق مع بحثك' },
    body: { en: 'A new job posting matches your saved search criteria.', ar: 'إعلان وظيفي جديد يتطابق مع معايير بحثك المحفوظ.' },
  },
  [NotificationType.DisputeResolved]: {
    title: { en: 'Dispute resolved', ar: 'تم حل النزاع' },
    body: { en: 'A dispute you were involved in has been resolved by an administrator.', ar: 'تم حل نزاع كنت طرفًا فيه من قبل أحد المسؤولين.' },
  },
};

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  /**
   * Dispatch a notification to a user.
   *
   * The content (title and body in EN + AR) is determined entirely by the type —
   * callers cannot provide custom content. This enforces Correctness Property 1:
   * the message a user sees will always accurately reflect the event type.
   *
   * Optional context can be passed for interpolation in future (e.g. job title),
   * but the type determines which notification bucket it falls into.
   */
  async send(
    userId: string,
    type: NotificationType,
    options?: {
      referenceType?: string;
      referenceId?: string;
    },
  ) {
    const content = NOTIFICATION_CONTENT[type];
    if (!content) {
      throw new Error(`No content defined for notification type: ${type}`);
    }

    return this.repository.create({
      userId,
      type,
      title: content.title,
      body: content.body,
      referenceType: options?.referenceType ?? null,
      referenceId: options?.referenceId ?? null,
      isRead: false,
    });
  }

  async getMyNotifications(userId: string, page = 1, limit = 30) {
    const offset = (page - 1) * limit;
    const [data, unreadCount] = await Promise.all([
      this.repository.listByUser(userId, limit, offset),
      this.repository.countUnread(userId),
    ]);
    return { data, unreadCount, page, limit };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.repository.markRead(notificationId, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repository.markAllRead(userId);
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repository.countUnread(userId);
    return { count };
  }
}
