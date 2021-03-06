import React, { useState, useCallback, useEffect } from 'react';
import { NextPage } from 'next';
import cls from 'classnames';
import InfiniteScroll from 'react-infinite-scroller';
import { ArticleProvider } from '@providers/article';
import { ArticleList } from '@components/ArticleList';
import { ArticleCarousel } from '@components/ArticleCarousel';
import { RecommendArticles } from '@components/RecommendArticles';
import { Tags } from '@components/Tags';
import { Categories } from '@components/Categories';
import { Footer } from '@components/Footer';
import style from './index.module.scss';

interface IHomeProps {
  articles: IArticle[];
  total: number;
  recommendedArticles: IArticle[];
}

const pageSize = 12;

const Home: NextPage<IHomeProps> = (props) => {
  const {
    articles: defaultArticles = [],
    recommendedArticles = [],
    total = 0,
    setting = {},
    categories = [],
    tags = [],
  } = props as any;
  const [affix, setAffix] = useState(false);
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<IArticle[]>(defaultArticles);

  useEffect(() => {
    const handler = () => {
      const y = (window as any).scrollY;
      setAffix(y > 380);
    };

    document.addEventListener('scroll', handler);

    return () => {
      document.removeEventListener('scroll', handler);
    };
  }, []);

  useEffect(() => {
    setArticles(defaultArticles);
  }, [defaultArticles]);

  const getArticles = useCallback((page) => {
    ArticleProvider.getArticles({
      page,
      pageSize,
      status: 'publish',
    }).then((res) => {
      setPage(page);
      setArticles((articles) => [...articles, ...res[0]]);
    });
  }, []);

  return (
    <div className={style.wrapper}>
      <ArticleCarousel articles={recommendedArticles} />
      <div className={cls('container', style.container)}>
        <div className={style.content}>
          <InfiniteScroll
            pageStart={1}
            loadMore={getArticles}
            hasMore={page * pageSize < total}
            loader={
              <div className={style.loading} key={0}>
                正在获取文章...
              </div>
            }
          >
            <ArticleList articles={articles} />
          </InfiniteScroll>
          <aside className={cls(style.aside)}>
            <div>
              <div
                style={{
                  transform: `translateY(${affix ? '-100%' : 0})`,
                  transition: 'none',
                }}
              >
                <RecommendArticles mode="inline" />
              </div>
              <div className={cls(affix ? style.isFixed : false)}>
                <Categories categories={categories} />
                <Tags tags={tags} />
                <Footer className={style.footer} setting={setting} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// 服务端预取数据
Home.getInitialProps = async () => {
  const [articles, recommendedArticles] = await Promise.all([
    ArticleProvider.getArticles({ page: 1, pageSize, status: 'publish' }),
    ArticleProvider.getAllRecommendArticles().catch(() => []),
  ]);
  return {
    articles: articles[0],
    total: articles[1],
    recommendedArticles,
    needLayoutFooter: false,
  };
};

export default Home;
