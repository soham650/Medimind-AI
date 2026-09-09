import { prescriptionService as standardService } from './prescription.service';

/**
 * Compatibility wrapper for Core Service 4: Prescription Service.
 * Delegates all operations to the hardened prescription.service.js,
 * guaranteeing transactional integrity via create_prescription_tx RPC.
 */
export const prescriptionService = {
  createPrescription: (params) => standardService.createPrescription(params),
  getPatientPrescriptions: (patientId) => standardService.getPatientPrescriptions(patientId),
  getDoctorPrescriptions: (doctorId) => standardService.getDoctorPrescriptions(doctorId),
  getPrescriptionByRxId: (rxId) => standardService.getPrescriptionByRxId(rxId),
  getDailyDoseSchedule: (patientId) => standardService.getDailyDoseSchedule(patientId),
  logDoseStatus: (scheduleId, status) => standardService.logDoseStatus(scheduleId, status),
  createMedicationSchedules: (patientId, prescriptionId, items) => standardService.createMedicationSchedules(patientId, prescriptionId, items)
};
