import React from 'react';
import { Related } from '../components/Sections.jsx';

export default function NotFound() {
  return (
    <div className="wrap narrow">
      <div className="page-head">
        <h1>페이지를 찾을 수 없어요</h1>
        <p className="lead">주소가 바뀌었거나 없는 페이지예요. 아래에서 필요한 계산기를 찾아보세요.</p>
      </div>
      <a className="btn btn-primary btn-block" href="/">내 알바비 계산하러 가기</a>
      <Related keys={['calculator', 'paycheckCheck', 'weekly', 'paycheck']} title="많이 찾는 도구" />
    </div>
  );
}
