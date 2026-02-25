import React, { useState } from 'react';
import { Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSiteStore } from '../../stores';
import styles from './search-box.module.less';

const { Option } = Select;

const SearchBox: React.FC = () => {
  const { searchEngines } = useSiteStore();
  const [query, setQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState(0);

  const handleSearch = () => {
    if (query.trim()) {
      const engine = searchEngines[selectedEngine];
      const url = engine.url.replace('{query}', encodeURIComponent(query));
      window.open(url, '_blank');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={styles.searchBox}>
      <div className={styles.searchForm}>
        <Select
          value={selectedEngine}
          onChange={setSelectedEngine}
          className={styles.engineSelect}
          size="large"
          dropdownMatchSelectWidth={false}
        >
          {searchEngines.map((engine, index) => (
            <Option key={index} value={index}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={engine.icon}
                  alt={engine.name}
                  style={{ width: 16, height: 16 }}
                />
                {engine.name}
              </span>
            </Option>
          ))}
        </Select>
        <Input
          placeholder="输入搜索内容..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          size="large"
          className={styles.searchInput}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          size="large"
          className={styles.searchButton}
        >
          搜索
        </Button>
      </div>
    </div>
  );
};

export default SearchBox;
