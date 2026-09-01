# 로그인 게시판 (Vue + Express + MariaDB, Docker 미사용)

macOS 12 Monterey + MacPorts로 설치한 MariaDB 환경에 맞춰 새로 만든 버전입니다.
Docker, Colima, QEMU는 전혀 사용하지 않습니다. 화면(Vue)은 이미 빌드되어
`backend/public` 폴더에 포함되어 있으므로, 백엔드만 설치하면 바로 실행됩니다.

## 포함 기능

- 아이디/비밀번호 회원가입·로그인·로그아웃 (Argon2id 해시로 비밀번호 저장)
- 게시글 목록(페이지네이션, 검색), 상세, 작성, 수정, 삭제
- 공지글 등록/해제: 관리자만 가능
- 댓글 작성·삭제
- 첨부파일: 이미지(png/jpeg/gif/webp), PDF, TXT / 최대 3개 / 파일당 10MB
- 작성자 본인 또는 관리자만 게시글·댓글 수정·삭제 가능
- 관리자용 회원 목록 화면
- 최초 실행 시 관리자 계정 자동 생성

## 사전 준비 (이미 완료하신 부분)

이미 아래 상태까지 되어 있다고 가정합니다.

- MariaDB 10.11 (MacPorts) 실행 중, `127.0.0.1:3306`에서 접속 가능
- 데이터베이스 `boarddb` 생성됨
- 계정 `admin` / 비밀번호 `whxodhks`로 `boarddb`에 모든 권한 부여됨

아래로 확인해 보세요.

```bash
mariadb -u admin -p -h 127.0.0.1 -P 3306 boarddb
```

비밀번호에 `whxodhks`를 입력해서 접속되면 준비가 끝난 것입니다. (`SELECT DATABASE();` 후 `EXIT;`)

## 1. 압축 해제 및 이동

압축을 원하는 위치에 풀고 그 폴더로 이동하세요. 예시:

```bash
cd ~/Downloads/board-app
```

## 2. 환경 설정 파일 만들기

```bash
cp .env.example .env
open -e .env
```

기본값은 이미 지금 환경(`admin` / `whxodhks` / `boarddb`)에 맞춰져 있습니다. 다만
`SESSION_SECRET`은 반드시 아무 의미 없는 32자 이상의 임의 문자열로 바꾸세요.

```env
PORT=8080

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=boarddb
DB_USER=admin
DB_PASSWORD=whxodhks

SESSION_SECRET=여기에-32자-이상의-임의의-문자열을-입력하세요

ADMIN_USERNAME=admin
ADMIN_PASSWORD=whxodhks
```

이 `.env`는 프로젝트 최상위 폴더(`board-app/.env`)에 있어야 합니다. `backend`
서버가 자동으로 이 파일을 읽으므로, 예전처럼 `source ../.env`를 직접 실행할
필요가 없습니다.

## 3. 백엔드 패키지 설치

```bash
cd backend
npm install
```

## 4. 서버 실행

```bash
npm start
```

정상적으로 실행되면 아래처럼 표시됩니다.

```text
관리자 계정이 생성되었습니다: admin
Running 8080
```

(두 번째 실행부터는 "관리자 계정이 생성되었습니다" 줄은 나오지 않습니다. 이미
있으므로 정상입니다.)

## 5. 접속

브라우저에서 다음 주소를 여세요.

```text
http://localhost:8080
```

관리자 로그인:

```text
아이디: admin
비밀번호: whxodhks
```

일반 회원은 화면의 "회원가입"으로 새로 만들 수 있습니다.

## 서버 끄기 / 다시 켜기

실행 중인 터미널에서 `Ctrl + C`를 누르면 종료됩니다. 다시 시작할 때는:

```bash
cd ~/Downloads/board-app/backend
npm start
```

## 화면(Vue) 소스를 수정하고 싶다면

`backend/public`에는 이미 빌드된 결과물이 들어 있어 수정 없이 바로 쓸 수
있습니다. 화면 디자인이나 기능을 직접 고치고 싶을 때만 아래 과정이 필요합니다.

```bash
cd frontend
npm install
npm run dev
```

`npm run dev`는 `http://localhost:5173`에서 실시간 미리보기를 띄우고, 내부적으로
`/api` 요청을 `http://localhost:8080`(백엔드)으로 전달합니다. 백엔드도 함께
실행해 둔 상태에서 사용하세요.

수정을 마치고 실제 서비스에 반영하려면 다시 빌드한 뒤 결과물을 복사합니다.

```bash
npm run build
rm -rf ../backend/public/*
cp -R dist/* ../backend/public/
```

## 데이터 직접 확인하기

```bash
mariadb -u admin -p -h 127.0.0.1 -P 3306 boarddb
```

```sql
SHOW TABLES;
SELECT id, username, role, created_at FROM users;
SELECT id, title, is_notice, created_at FROM posts;
```

## 폴더 구조

```text
board-app/
├── .env.example
├── backend/                  # Express API + 정적 화면 제공
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js
│   │   ├── initDb.js
│   │   ├── middleware/auth.js
│   │   └── routes/ (auth, posts, comments, admin)
│   ├── public/                # 빌드된 Vue 화면 (이미 포함됨)
│   └── uploads/                # 첨부파일 저장 위치 (자동 생성)
└── frontend/                  # Vue 3 + Vite 소스 (수정 시에만 필요)
    └── src/
        ├── views/
        ├── router/
        ├── store/
        └── api/
```

## 운영(외부 공개) 전 참고

이 구성은 로컬 학습·사내 개발용입니다. 외부에 공개하는 서비스로 쓰려면
HTTPS 적용, 리버스 프록시, CSRF 방어, 요청 속도 제한, 업로드 파일 검사,
DB 백업, 감사 로그 등을 추가로 고려해야 합니다.
