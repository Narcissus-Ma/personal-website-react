import React, { useState, useEffect } from "react";
import { Input, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useSiteStore } from "../../stores";
import styles from "./search-box.module.less";
import { SearchEngine } from "src/types/search-engine";

const SearchBox: React.FC = () => {
  const { searchEngines } = useSiteStore();
  const [query, setQuery] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>(
    searchEngines[0],
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
      window.open(searchUrl, "_blank");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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
          value={selectedEngine?.name}
          onChange={(value) => {
            const engine = searchEngines.find((e) => e.name === value);
            if (engine) handleEngineChange(engine);
          }}
          options={searchEngines.map((engine) => ({
            value: engine.name,
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img
                  src={engine.icon}
                  alt={engine.name}
                  style={{ width: 16, height: 16 }}
                />
                {engine.name}
              </span>
            ),
          }))}
          className={styles.engineSelect}
          size="large"
          popupMatchSelectWidth={false}
        />
        <Input
          placeholder="输入搜索内容..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
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
