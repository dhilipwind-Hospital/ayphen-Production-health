import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AppointmentFeedback } from '../models/AppointmentFeedback';
import { Appointment, AppointmentStatus } from '../models/Appointment';

export class AppointmentFeedbackController {
  // Submit feedback for appointment
  static submitFeedback = async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const {
        doctorRating,
        facilityRating,
        staffRating,
        overallRating,
        doctorComment,
        facilityComment,
        overallComment,
        wouldRecommend,
        followUpNeeded,
        followUpReason
      } = req.body;

      const patientId = (req as any).user?.id;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Get appointment
      const appointmentRepo = AppDataSource.getRepository(Appointment);
      const appointment = await appointmentRepo.findOne({
        where: { id: appointmentId, organizationId: tenantId }
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if appointment is completed
      if (appointment.status !== AppointmentStatus.COMPLETED) {
        return res.status(400).json({ message: 'Can only rate completed appointments' });
      }

      // Check if feedback already exists
      const feedbackRepo = AppDataSource.getRepository(AppointmentFeedback);
      let feedback = await feedbackRepo.findOne({
        where: { appointmentId, patientId, organizationId: tenantId }
      });

      if (!feedback) {
        feedback = feedbackRepo.create({
          appointmentId,
          patientId,
          doctorId: appointment.doctorId!,
          organizationId: tenantId
        });
      }

      // Update feedback
      feedback.doctorRating = doctorRating || 0;
      feedback.facilityRating = facilityRating || 0;
      feedback.staffRating = staffRating || 0;
      feedback.overallRating = overallRating || 0;
      feedback.doctorComment = doctorComment;
      feedback.facilityComment = facilityComment;
      feedback.overallComment = overallComment;
      feedback.wouldRecommend = wouldRecommend || false;
      feedback.followUpNeeded = followUpNeeded || false;
      feedback.followUpReason = followUpReason;

      await feedbackRepo.save(feedback);

      return res.json({ success: true, message: 'Feedback submitted', feedback });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({ message: 'Failed to submit feedback' });
    }
  };

  // Get doctor ratings
  static getDoctorRatings = async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(AppointmentFeedback);

      const feedbacks = await feedbackRepo.find({
        where: { doctorId, organizationId: tenantId },
        relations: ['patient'],
        order: { createdAt: 'DESC' }
      });

      // Calculate average ratings
      const avgRating = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length
        : 0;

      const avgDoctorRating = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.doctorRating, 0) / feedbacks.length
        : 0;

      const recommendCount = feedbacks.filter(f => f.wouldRecommend).length;
      const recommendPercentage = feedbacks.length > 0
        ? (recommendCount / feedbacks.length) * 100
        : 0;

      return res.json({
        doctorId,
        totalFeedbacks: feedbacks.length,
        averageRating: parseFloat(avgRating.toFixed(2)),
        averageDoctorRating: parseFloat(avgDoctorRating.toFixed(2)),
        wouldRecommendPercentage: parseFloat(recommendPercentage.toFixed(2)),
        recentFeedbacks: feedbacks.slice(0, 5)
      });
    } catch (error) {
      console.error('Error getting doctor ratings:', error);
      return res.status(500).json({ message: 'Failed to fetch ratings' });
    }
  };

  // Get appointment feedback
  static getAppointmentFeedback = async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(AppointmentFeedback);

      const feedback = await feedbackRepo.findOne({
        where: { appointmentId, organizationId: tenantId }
      });

      if (!feedback) {
        return res.status(404).json({ message: 'No feedback found for this appointment' });
      }

      return res.json({ feedback });
    } catch (error) {
      console.error('Error getting feedback:', error);
      return res.status(500).json({ message: 'Failed to fetch feedback' });
    }
  };

  // Get all doctor feedbacks with statistics
  static getDoctorFeedbackStatistics = async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(AppointmentFeedback);

      const feedbacks = await feedbackRepo.find({
        where: { doctorId, organizationId: tenantId },
        order: { createdAt: 'DESC' }
      });

      // Calculate statistics
      const stats = {
        totalFeedbacks: feedbacks.length,
        averageRating: feedbacks.length > 0
          ? parseFloat((feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length).toFixed(2))
          : 0,
        ratingBreakdown: {
          fiveStar: feedbacks.filter(f => f.overallRating === 5).length,
          fourStar: feedbacks.filter(f => f.overallRating === 4).length,
          threeStar: feedbacks.filter(f => f.overallRating === 3).length,
          twoStar: feedbacks.filter(f => f.overallRating === 2).length,
          oneStar: feedbacks.filter(f => f.overallRating === 1).length,
          zeroStar: feedbacks.filter(f => f.overallRating === 0).length
        },
        wouldRecommendPercentage: feedbacks.length > 0
          ? parseFloat(((feedbacks.filter(f => f.wouldRecommend).length / feedbacks.length) * 100).toFixed(2))
          : 0,
        followUpNeededCount: feedbacks.filter(f => f.followUpNeeded).length,
        averageDoctorRating: feedbacks.length > 0
          ? parseFloat((feedbacks.reduce((sum, f) => sum + f.doctorRating, 0) / feedbacks.length).toFixed(2))
          : 0,
        averageFacilityRating: feedbacks.length > 0
          ? parseFloat((feedbacks.reduce((sum, f) => sum + f.facilityRating, 0) / feedbacks.length).toFixed(2))
          : 0,
        averageStaffRating: feedbacks.length > 0
          ? parseFloat((feedbacks.reduce((sum, f) => sum + f.staffRating, 0) / feedbacks.length).toFixed(2))
          : 0,
        recentFeedbacks: feedbacks.slice(0, 10)
      };

      return res.json(stats);
    } catch (error) {
      console.error('Error getting feedback statistics:', error);
      return res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  };
}
