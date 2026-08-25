trigger SessionTrigger on Session__c (before insert, before update) {
    if (Trigger.isBefore && (Trigger.isInsert || Trigger.isUpdate)) {
        // Prevent double booking logic
        Map<Id, Session__c> oldMap = Trigger.isUpdate ? Trigger.oldMap : new Map<Id, Session__c>();
        
        for (Session__c session : Trigger.new) {
            // Add validation logic here to prevent double bookings
        }
    }
}