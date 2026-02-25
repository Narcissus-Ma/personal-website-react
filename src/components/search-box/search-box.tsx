import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSiteStore } from '../../stores';
import styles from './search-box.module.less';
import { SearchEngine } from 'src/types/search-engine';

const SearchBox: React.FC = () => {
  const { searchEngines } = useSiteStore();
  const [query, setQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>(
    searchEngines[0]
  );

  useEffect(() => {
    if (searchEngines.length > 0) {
      setSelectedEngine(searchEngines[0]);
    }
  }, [searchEngines.length]);

  const handleSearch = () => {
    if (query.trim() && searchEngines.length > 0) {
      const engine = selectedEngine || searchEngines[0];
      if (!engine) return;
      const searchUrl = engine.url + encodeURIComponent(query);
      window.open(searchUrl, '_blank');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEngineChange = (engine: SearchEngine) => {
    setSelectedEngine(engine);
  };

  return (
    <div className={styles.searchBox}>
      <div className={styles.searchForm}>
        <Select
          className={styles.engineSelect}
          options={searchEngines.map(engine => ({
            value: engine.name,
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  alt={engine.name}
                  src={engine.icon}
                  style={{ width: 16, height: 16 }}
                />
                {engine.name}
              </span>
            ),
          }))}
          popupMatchSelectWidth={false}
          size="large"
          value={selectedEngine?.name}
          onChange={value => {
            const engine = searchEngines.find(e => e.name === value);
            if (engine) handleEngineChange(engine);
          }}
        />
        <Input
          className={styles.searchInput}
          placeholder="输入搜索内容..."
          size="large"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <Button
          className={styles.searchButton}
          icon={<SearchOutlined />}
          size="large"
          type="primary"
          onClick={handleSearch}
        >
          搜索
        </Button>
      </div>
    </div>
  );
};

export default SearchBox;
