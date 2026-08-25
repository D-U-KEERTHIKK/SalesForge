/**
 * SessionTriggerHandler
 * Handles trigger logic for the Session__c custom object.
 * Provides validation to prevent double-booking of speakers.
 */
public class SessionTriggerHandler {

	/**
	 * preventDoubleBooking
	 * Validates that a speaker is not already booked for another session on the same date.
	 * Adds field errors to records that violate this constraint.
	 *
	 * @param newRecords List of incoming Session__c records (as SObjects)
	 * @param oldMap Map of previous Session__c records by Id (nullable for inserts)
	 */
	public static void preventDoubleBooking(List<SObject> newRecords, Map<Id, SObject> oldMap) {
		if (newRecords == null || newRecords.isEmpty()) {
			return;
		}

		Set<Id> speakerIds = new Set<Id>();
		Set<Id> currentIds = new Set<Id>();

		// Build speaker IDs and current record IDs from incoming records
		for (SObject record : newRecords) {
			Map<String, Object> recordMap = (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(record));
			Id speakerId = (Id) recordMap.get('Speaker__c');
			if (speakerId != null) {
				speakerIds.add(speakerId);
			}
			currentIds.add(record.Id);
		}

		if (speakerIds.isEmpty()) {
			return;
		}

		// Query for existing sessions with the same speakers
		String dynamicQuery = 'SELECT Id, Speaker__c, Start_Time__c FROM Session__c WHERE Speaker__c IN :speakerIds AND Id NOT IN :currentIds';
		List<SObject> existingSessions = Database.query(dynamicQuery);

		// Build map of speakerId + date keys from existing sessions
		Set<String> bookedKeys = new Set<String>();
		for (SObject existingSession : existingSessions) {
			Map<String, Object> existingMap = (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(existingSession));
			Id existingSpeakerId = (Id) existingMap.get('Speaker__c');
			String startTimeStr = (String) existingMap.get('Start_Time__c');

			if (existingSpeakerId != null && startTimeStr != null) {
				String dateKey = buildDateKey(existingSpeakerId, startTimeStr);
				bookedKeys.add(dateKey);
			}
		}

		// Validate incoming records against booked keys
		for (SObject record : newRecords) {
			Map<String, Object> recordMap = (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(record));
			Id speakerId = (Id) recordMap.get('Speaker__c');
			String startTimeStr = (String) recordMap.get('Start_Time__c');

			if (speakerId != null && startTimeStr != null) {
				String dateKey = buildDateKey(speakerId, startTimeStr);
				if (bookedKeys.contains(dateKey)) {
					record.addError('This speaker is already booked for another session on this date.');
				}
			}
		}
	}

	/**
	 * buildDateKey
	 * Helper method to build a composite key from speaker ID and start time date.
	 *
	 * @param speakerId The speaker ID
	 * @param startTime The start time string (ISO format or similar)
	 * @return Composite key string
	 */
	private static String buildDateKey(Id speakerId, String startTime) {
		if (startTime == null || startTime.length() < 10) {
			return speakerId + '::';
		}
		String dateStr = startTime.substring(0, 10);
		return speakerId + '::' + dateStr;
	}
}