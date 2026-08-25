# Little Atelier

"나무 작업대에서, 나만의 가구를 완성하다"

**Little Atelier**는 조립부터 페인팅, 사포질까지 직접 손으로 가구를 완성해 나가는 아늑한 목공방 시뮬레이션 게임입니다. PC 환경을 대상으로 개발되었으며, 마우스 인터랙션을 통해 가구가 만들어지는 성취감과 아기자기한 공방의 분위기를 경험할 수 있습니다.

---

## 주요 특징

- **3단계 공정 시스템**: 재료 준비부터 조립, 페인팅, 사포질까지 실제 목공 공정을 충실히 녹여냈습니다.
- **몰입감 넘치는 인터랙션**: 마우스 드래그와 클릭을 통해 부품을 맞추고, 원하는 색상으로 칠하며 표면을 다듬을 수 있습니다.
- **실시간 커스터마이징**: PBR 머티리얼 제어 기술을 통해 나만의 감성이 담긴 가구를 디자인할 수 있습니다.
- **3D 인터랙티브 뷰어**: 제작이 완료된 가구를 웹상에서 360도 돌려보며 감상할 수 있습니다.

---

## 기술

- **Engine**: Unity
- **Web Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **3D Viewer**: `<model-viewer>` (Google)
- **Localization**: Multi-language support via GTranslate & Custom JSON i18n

---

## 📁 프로젝트 구조

```text
├── images/          # 히어로 씬, 공방 단계별 스크린샷, 개발 과정 이미지
├── models/          # 3D 가구 모델 (.glb)
├── script/          # 인터랙션 및 다국어 지원 스크립트 (main.js, i18n.js)
├── style/           # 스타일시트
└── index.html       # 메인 랜딩 페이지 (PC)
```

---

## Credits

- Desk by CMHT Oculus [CC-BY] via Poly Pizza
- church_meeting_room [CC0] via Dario Barresi
