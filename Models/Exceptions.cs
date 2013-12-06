using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Listonz.Models
{
    [Serializable]
    public class LZException : Exception
    {
        public LZException() { }
        public LZException(string message) : base(message) { }
        public LZException(string message, Exception inner) : base(message, inner) { }
        protected LZException(
          System.Runtime.Serialization.SerializationInfo info,
          System.Runtime.Serialization.StreamingContext context)
            : base(info, context) { }
    }

    [Serializable]
    public class DeletetionHaveChildrenLZException : LZException
    {
        public DeletetionHaveChildrenLZException() { }
        public DeletetionHaveChildrenLZException(string message) : base(message) { }
        public DeletetionHaveChildrenLZException(string message, Exception inner) : base(message, inner) { }
        protected DeletetionHaveChildrenLZException(
          System.Runtime.Serialization.SerializationInfo info,
          System.Runtime.Serialization.StreamingContext context)
            : base(info, context) { }
    }

    [Serializable]
    public class ConnectionTimeoutException : Exception
    {
        public ConnectionTimeoutException() { }
        public ConnectionTimeoutException(string message) : base(message) { }
        public ConnectionTimeoutException(string message, Exception inner) : base(message, inner) { }
        public ConnectionTimeoutException(Exception inner) : base("", inner) { }
        protected ConnectionTimeoutException(
          System.Runtime.Serialization.SerializationInfo info,
          System.Runtime.Serialization.StreamingContext context)
            : base(info, context) { }
    }
}