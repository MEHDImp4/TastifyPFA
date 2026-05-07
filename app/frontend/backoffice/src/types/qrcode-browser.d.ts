declare module 'qrcode/lib/browser.js' {
  interface QRCodeToDataURLOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  interface QRCodeBrowserApi {
    toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
  }

  const QRCode: QRCodeBrowserApi;
  export default QRCode;
}
