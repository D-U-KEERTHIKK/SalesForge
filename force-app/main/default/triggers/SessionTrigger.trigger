trigger SessionTrigger on Session__c (before insert, before update) {
  if (Trigger.isBefore && Trigger.isInsert) {
    preventDoubleBooking(Trigger.new);
  }
  if (Trigger.isBefore && Trigger.isUpdate) {
    preventDoubleBooking(Trigger.new);
  }
}

private static void preventDoubleBooking(List<Session__c> newSessions) {
  Set<Id> sessionIds = new Set<Id>();
  for (Session__c session : newSessions) {
    if (session.Id != null) {
      sessionIds.add(session.Id);
    }
  }
  
  if (sessionIds.isEmpty()) {
    return;
  }
  
  Map<Id, Session__c> existingSessions = new Map<Id, Session__c>(
    [SELECT Id, Name FROM Session__c WHERE Id IN :sessionIds WITH USER_MODE]
  );
  
  for (Session__c session : newSessions) {
    if (session.Id != null && existingSessions.containsKey(session.Id)) {
      session.addError('This session is already booked.');
    }
  }
}