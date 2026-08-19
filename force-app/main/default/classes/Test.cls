public class Test {

    public class Request {
        @InvocableVariable
        public String inputOne;

        @InvocableVariable
        public String inputTwo;

        @InvocableVariable
        public String inputThree;
    }

    @InvocableMethod(label='Test Method')
    public static void run(List<Request> requests) {
        // dummy logic
    }
}