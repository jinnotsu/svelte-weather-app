export class ShareService {
  static getShareText(selectedItem: any): string {
    if (!selectedItem) return '';
    return `${selectedItem.city}の気温は現在${selectedItem.temp}℃で現在日本${selectedItem.rank}位です🥶 #日本で気温が低い場所`;
  }

  static async copyToClipboard(selectedItem: any): Promise<string> {
    try {
      const shareText = this.getShareText(selectedItem);
      const fullText = `${shareText} ${window.location.href}`;
      await navigator.clipboard.writeText(fullText);
      return 'コピーしました！';
    } catch (error) {
      return 'コピーに失敗';
    }
  }

  static getGoogleSearchUrl(selectedItem: any): string {
    if (!selectedItem) return 'https://www.google.com/';
    const searchQuery = `${selectedItem.city} ${selectedItem.region} 観光`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }

  static getTwitterShareUrl(selectedItem: any): string {
    const shareText = this.getShareText(selectedItem);
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(window.location.href);
    return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  }

  static getFacebookShareUrl(selectedItem: any): string {
    const shareText = this.getShareText(selectedItem);
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(window.location.href);
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  }
}
