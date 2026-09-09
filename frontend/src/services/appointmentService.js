import { appointmentService as standardAppointmentService } from './appointment.service';

/**
 * Compatibility wrapper for appointmentService.
 * Delegates to standard appointment.service.js.
 */
export const appointmentService = {
  createAppointment: (params) => standardAppointmentService.createAppointment(params),
  getAppointmentById: (appointmentId) => standardAppointmentService.getAppointmentById(appointmentId),
  getPatientAppointments: (patientId) => standardAppointmentService.getPatientAppointments(patientId),
  getDoctorAppointments: (doctorId, filters) => standardAppointmentService.getDoctorAppointments(doctorId, filters),
  updateStatus: (appointmentId, status, reason) => standardAppointmentService.updateStatus(appointmentId, status, reason),
  friendlyError: (err) => standardAppointmentService.friendlyError(err)
};
