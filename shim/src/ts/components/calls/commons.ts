type Handshake = "handshake";

interface QueryCall
{
    query:Query
}

type ObjectCall = QueryCall;

type ShimCallResponse = number | QueryResultEvent;

type Call = ObjectCall | Handshake;