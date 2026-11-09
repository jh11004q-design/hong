# CAD BOM · 2D 도면 자재 산출 및 3D 조감도

PDF·ASCII DXF를 브라우저에서 분석하고 BOM과 3D 개념 모델을 생성합니다.

## 실행

Node.js 22 이상과 npm이 필요합니다.

```bash
cd cad-bom-agent
npm ci
npm run build
python3 -m http.server 8080 --directory dist
```

http://localhost:8080 에서 사용하세요. 정적 호스팅에는 빌드된 dist/를 배포합니다.

## 기능

- DXF 블록·배열 수량 및 레이어별 선·호·원·폴리라인 길이 집계
- PDF 텍스트의 명시 수량 후보, 페이지별 원문 근거와 미리보기
- 자재명·규격·수량·단가·할증·검토 상태 편집 및 Excel 출력
- PDF 닫힌 직선 윤곽·DXF 닫힌 폴리라인의 3D 입체화
- 스캔 PDF 수동 윤곽 지정과 실제 폭·높이 입력
- 조감도 PNG, GLB, Blender Python 스크립트 출력

## 범위와 한계

파일당 최대 100MB(100,000,000바이트), PDF 최대 100페이지입니다. 1TB 파일 저장·분석, DWG 직접 읽기, 스캔 OCR은 지원하지 않습니다. PDF 도형의 실제 길이·개수는 자동 측정하지 않습니다.

3D는 윤곽을 높이로 올린 개념 모델입니다. PDF 기본 폭 30m·높이 3m는 가정값이므로 확인해야 합니다. 벽·창·지붕·구조·BIM 자동 복원은 아닙니다. 도곽·해치 등의 불필요한 후보를 사용자가 제외해야 합니다.

웹 3D는 Three.js로 실행하며 Blender 원격 서버는 연결되어 있지 않습니다. GLB 또는 생성한 Python 스크립트를 Blender에서 열어 후속 작업합니다. REA 또는 AI 모델은 호출하지 않습니다.

개인 도면 PDF, 사이트 식별 설정, 인증 정보와 설치 패키지는 제외했습니다. 파일은 브라우저 안에서 분석합니다. 원래 저장소의 게임 웹사이트는 그대로 유지됩니다.

## 검증

```bash
node test-engine.mjs
node test-pdf.mjs
node test-3d.mjs
```

DXF 단위·곡선 길이·블록 배열·배치 공간 제외, 실제 다중 페이지 PDF, PDF 벡터 좌표 변환과 Blender 스크립트 생성을 확인합니다. Blender 4.3.2에서 메시 생성·렌더링을 검증했습니다. 브라우저 조작 검증은 환경 미리보기 연결 오류로 완료하지 못했습니다.

## 주요 파일

| 파일 | 역할 |
|---|---|
| app.js | 업로드·BOM 편집·Excel 출력 |
| engine.js | DXF 파싱·집계 |
| pdf-engine.js | PDF 텍스트 수량 추출 |
| viewer3d.js | 3D 뷰어·윤곽 편집·내보내기 |
| geometry3d.js | 윤곽 검증·변환·Blender 스크립트 |
| dist/index.html, dist/style.css | 화면·스타일 원본 |
| build-assets.mjs | PDF 워커·폰트·WASM 빌드 자산 복사 |
