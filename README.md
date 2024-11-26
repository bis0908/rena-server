# rena-server (N 메일 발송 서버)

# 실행 방법

### Docker 설치

Windows:
[Docker download](https://www.docker.com/products/docker-desktop/)

Linux:

```shell
sudo apt install -y docker.io
```

### rena-sender 이미지 다운로드 (도커는 백그라운드에서 실행중이어 함)

```shell
docker pull ghcr.io/bis0908/rena-sender:latest
```

### 실행 (발송 서버 이름은 임의로 지정해도 무방)

```shell
docker run -p 외부포트입력:3030 -d --name rena-sender ghcr.io/bis0908/rena-sender:latest
```

```
renamailer-mail-backend
├─ .gitignore
├─ app.js
├─ config
│  ├─ dbConfig.js
│  └─ logger.js
├─ models
│  ├─ mail-service.js
│  └─ query-service.js
├─ package-lock.json
├─ package.json
└─ routes
   ├─ db-router.js
   └─ mail-router.js

```
