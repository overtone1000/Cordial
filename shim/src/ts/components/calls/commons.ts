interface QueryCall
{
    data:Query
}

type ShimCallResponse = number | QueryResultEvent;

type Call = QueryCall;