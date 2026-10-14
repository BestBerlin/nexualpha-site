
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import feed from '../../public/content/news-feed.json' with { type: 'json' };
      import { NewsDetailPage } from '../../src/components/v3/news/NewsDetailPage.jsx';
      const html = renderToStaticMarkup(React.createElement(NewsDetailPage, {
        slug: 'tokenized-treasuries-structure-access-risks',
        locale: 'en',
        initialArticles: feed.articles,
      }));
      console.log(JSON.stringify({ html }));
    