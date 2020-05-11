import React from 'react';
import styles from './index.less';

export default ({ title, color, style = {}, children }) => (
  <div className={styles.cardPane} style={{ ...style, backgroundColor: color }}>
    <header>{title}</header>
    <main>
      {children}
    </main>
  </div>
);
