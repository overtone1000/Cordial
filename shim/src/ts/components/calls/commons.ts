var call_url = "http://localhost:43529/";

interface QueryCall
{
    context: "query",
    data:Query
}

type ShimCallResponse = number | QueryResultEvent;

type Call = QueryCall;