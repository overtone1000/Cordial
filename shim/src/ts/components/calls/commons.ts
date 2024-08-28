interface QueryCall
{
    context: "query",
    data:Query
}

type ShimCallResponse = number | QueryResultEvent;

type Call = QueryCall;