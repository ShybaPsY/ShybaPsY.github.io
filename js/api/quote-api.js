// ================================================
// QUOTE API MODULE
// ================================================

export const QuoteAPI = {
    cache: {
        quote: null,
        timestamp: 0
    },
    cacheTime: 60 * 1000, // 1 minute

    fallbackQuotes: [
        { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
        { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
        { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
        { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
        { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
        { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
        { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
        { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
        { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
        { text: "It's not a bug – it's an undocumented feature.", author: "Anonymous" },
        { text: "Premature optimization is the root of all evil.", author: "Donald Knuth" },
        { text: "There are only two hard things in Computer Science: cache invalidation and naming things.", author: "Phil Karlton" },
        { text: "Weeks of coding can save you hours of planning.", author: "Anonymous" },
        { text: "Deleted code is debugged code.", author: "Jeff Sickel" },
        { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
        { text: "Truth can only be found in one place: the code.", author: "Robert C. Martin" },
        { text: "The most disastrous thing that you can ever learn is your first programming language.", author: "Alan Kay" },
        { text: "Testing leads to failure, and failure leads to understanding.", author: "Burt Rutan" }
    ],

    async fetch() {
        // A api.quotable.io saiu do ar (certificado expirado), então as
        // citações vêm do pool local — sem chamada de rede que sempre falha
        let quote;
        do {
            quote = this.fallbackQuotes[Math.floor(Math.random() * this.fallbackQuotes.length)];
        } while (quote === this.cache.quote && this.fallbackQuotes.length > 1);

        this.cache.quote = quote;
        return quote;
    },

    format(quote) {
        return `
  <span class="detail-cyan">💭 Quote of the Moment:</span>

  <span class="highlight">"${quote.text}"</span>

  <span class="comment">— ${quote.author}</span>`;
    }
};
