interface QueryCall
{
    query:Query
}

type ShimCallResponse = number | QueryResultEvent;

type Call = QueryCall;