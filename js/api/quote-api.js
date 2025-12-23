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
        { text: "It's not a bug – it's an undocumented feature.", author: "Anonymous" }
    ],

    async fetch() {
        const now = Date.now();
        if (this.cache.quote && (now - this.cache.timestamp < this.cacheTime)) {
            return this.cache.quote;
        }

        try {
            const response = await fetch('https://api.quotable.io/random?tags=technology,famous-quotes');
            if (!response.ok) {
                throw new Error('Failed to fetch quote');
            }
            const data = await response.json();

            const quote = {
                text: data.content,
                author: data.author
            };

            this.cache.quote = quote;
            this.cache.timestamp = now;

            return quote;
        } catch (error) {
            console.error('Quote API error:', error);
            return this.fallbackQuotes[Math.floor(Math.random() * this.fallbackQuotes.length)];
        }
    },

    format(quote) {
        return `
  <span class="detail-cyan">💭 Quote of the Moment:</span>

  <span class="highlight">"${quote.text}"</span>

  <span class="comment">— ${quote.author}</span>`;
    }
};
