import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MonacoMemoryManager } from '../../services/monacoMemoryManager';

/**
 * 🔍 Monaco 메모리 사용량 모니터링 컴포넌트
 * 
 * 개발자 도구로 메모리 누수 감지 및 성능 최적화에 활용
 */

const MemoryPanel = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(45, 45, 48, 0.95);
  border: 1px solid #464647;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #cccccc;
  backdrop-filter: blur(10px);
  z-index: 9999;
  min-width: 250px;
`;

const MemoryTitle = styled.h4`
  margin: 0 0 8px 0;
  color: #007acc;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MemoryStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
`;

const StatLabel = styled.span`
  color: #cccccc;
`;

const StatValue = styled.span<{ $isHigh?: boolean }>`
  color: ${props => props.$isHigh ? '#f48771' : '#4ec9b0'};
  font-weight: bold;
`;

const ActionButton = styled.button`
  background: #007acc;
  border: none;
  color: white;
  padding: 4px 8px;
  font-size: 10px;
  border-radius: 3px;
  cursor: pointer;
  margin-right: 6px;
  
  &:hover {
    background: #005a9e;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  border: none;
  color: #999999;
  cursor: pointer;
  font-size: 12px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #ffffff;
  }
`;

interface MemoryStats {
  activeModels: number;
  registeredTabs: number;
  registeredUris: number;
  weakSetTracking: string;
}

export const MonacoMemoryMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 키보드 단축키로 메모리 모니터 토글 (Ctrl+Shift+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 자동 새로고침
  useEffect(() => {
    if (!isVisible || !autoRefresh) return;

    const interval = setInterval(() => {
      refreshStats();
    }, 2000); // 2초마다 갱신

    return () => clearInterval(interval);
  }, [isVisible, autoRefresh]);

  // 초기 로드
  useEffect(() => {
    if (isVisible) {
      refreshStats();
    }
  }, [isVisible]);

  const refreshStats = () => {
    const memoryManager = MonacoMemoryManager.getInstance();
    const newStats = memoryManager.getMemoryStats();
    setStats(newStats);
  };

  const handleCleanup = () => {
    const memoryManager = MonacoMemoryManager.getInstance();
    const cleanedCount = memoryManager.detectAndCleanLeaks();
    
    if (cleanedCount > 0) {
      alert(`🧹 ${cleanedCount}개의 누수 모델을 정리했습니다!`);
    } else {
      alert('✅ 메모리 누수가 발견되지 않았습니다.');
    }
    
    refreshStats();
  };

  const handleDisposeAll = () => {
    if (confirm('⚠️ 모든 Monaco 모델을 정리하시겠습니까? (현재 편집 중인 내용이 손실될 수 있습니다)')) {
      const memoryManager = MonacoMemoryManager.getInstance();
      memoryManager.disposeAll();
      alert('🗑️ 모든 Monaco 모델이 정리되었습니다.');
      refreshStats();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <MemoryPanel>
      <CloseButton onClick={() => setIsVisible(false)}>×</CloseButton>
      
      <MemoryTitle>
         Monaco Memory Monitor
      </MemoryTitle>

      {stats && (
        <>
          <MemoryStats>
            <StatItem>
              <StatLabel>활성 모델:</StatLabel>
              <StatValue $isHigh={stats.activeModels > 10}>
                {stats.activeModels}개
              </StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>등록된 탭:</StatLabel>
              <StatValue>
                {stats.registeredTabs}개
              </StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>URI 레지스트리:</StatLabel>
              <StatValue>
                {stats.registeredUris}개
              </StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>WeakSet:</StatLabel>
              <StatValue>
                추적 중
              </StatValue>
            </StatItem>
          </MemoryStats>

          <div style={{ marginBottom: '8px' }}>
            <ActionButton onClick={refreshStats}>
              🔄 새로고침
            </ActionButton>
            
            <ActionButton onClick={handleCleanup}>
              🧹 누수 정리
            </ActionButton>
            
            <ActionButton 
              onClick={handleDisposeAll}
              style={{ background: '#d73a49' }}
            >
              🗑️ 전체 정리
            </ActionButton>
          </div>

          <div style={{ fontSize: '10px', color: '#666666' }}>
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ marginRight: '4px' }}
              />
              자동 새로고침 (2초)
            </label>
          </div>

          <div style={{ marginTop: '6px', fontSize: '9px', color: '#888888' }}>
            Ctrl+Shift+M으로 토글
          </div>
        </>
      )}
    </MemoryPanel>
  );
};

export default MonacoMemoryMonitor;
