# MindFlow – App Android / iOS (Capacitor)

## Opção A – Sem PC (GitHub Actions)
1. No Lovable: **GitHub → Export/Connect** para o seu repositório.
2. Cada alteração enviada para `main` gera o APK automaticamente
   (ou abra **Actions → Build Android APK → Run workflow**).
3. Ao terminar, abra a execução e descarregue **mindflow-android-apk** (contém `mindflow.apk`).

> O APK é "debug" (pode instalar e partilhar em fóruns/APKPure/Uptodown, que aceitam APKs assinados;
> para publicação final crie uma keystore e use `assembleRelease`).

## Opção B – No seu PC (Windows, Linux ou Mac)
Requisitos: Node 20+, Java 21, Android Studio (iOS: Mac + Xcode).

```bash
git clone <seu-repositorio> && cd <pasta>
npm install
npx cap add android        # ou: npx cap add ios (apenas Mac)
npm run build
npx cap sync
npx cap run android        # ou: npx cap open android (abre no Android Studio)
```

Após cada atualização do código: `git pull && npm run build && npx cap sync`.

Adicione ao `android/app/src/main/AndroidManifest.xml` (o workflow já faz isso):
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```
