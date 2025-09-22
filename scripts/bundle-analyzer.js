// Bundle 분석을 위한 스크립트
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 📊 Bundle Size 분석 스크립트
 * 빌드 후 각 청크의 크기와 압축률을 분석합니다.
 */

const DIST_PATH = './dist';
const ASSETS_PATH = join(DIST_PATH, 'assets');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundles() {
  console.log('🔍 Bundle Size Analysis\n');
  
  if (!existsSync(ASSETS_PATH)) {
    console.log('❌ Build not found. Please run "npm run build" first.');
    return;
  }

  try {
    // dist 폴더의 모든 파일 크기 분석
    const files = execSync(`dir "${ASSETS_PATH}" /s`, { encoding: 'utf8' });
    console.log('📁 Assets folder contents:');
    console.log(files);

    // 주요 청크별 크기 분석
    const chunks = {
      'index': '메인 앱 번들',
      'vendor': '외부 라이브러리',
      'monaco': 'Monaco Editor',
      'react-vendor': 'React 관련',
      'file-vendor': '파일 처리',
      'editor-components': '에디터 컴포넌트',
      'ui-components': 'UI 컴포넌트'
    };

    console.log('\n📊 Chunk Analysis:');
    console.log('='.repeat(50));
    
    Object.entries(chunks).forEach(([key, description]) => {
      try {
        const jsFile = execSync(`dir "${ASSETS_PATH}\\${key}*.js" 2>nul`, { encoding: 'utf8' });
        if (jsFile.includes('.js')) {
          console.log(`✅ ${key.padEnd(20)} | ${description}`);
        }
      } catch (e) {
        console.log(`⚠️  ${key.padEnd(20)} | ${description} (not found)`);
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing bundles:', error.message);
  }
}

// 권장사항 출력
function printRecommendations() {
  console.log('\n💡 Bundle 최적화 권장사항:');
  console.log('='.repeat(50));
  console.log('1. 📦 대용량 라이브러리 지연 로딩');
  console.log('2. 🔄 Tree Shaking 최적화');
  console.log('3. ⚡ Dynamic Import 활용');
  console.log('4. 🗜️  압축률 개선');
  console.log('5. 📱 모바일 최적화');
  console.log('\n🔗 상세 분석: dist/stats.html 파일 확인');
}

analyzeBundles();
printRecommendations();
