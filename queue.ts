export class Queue<T> {
  private readonly data: Array<T> = [];
  private readonly onDataUserFn: (data: T) => any;
  private readonly onErrorUserFn: (data: T, err: any) => any;
  private async onData() {
    if (this.data.length === 0) return;
    const currentData = this.data[0];
    await this.onDataUserFn(currentData).catch((err: any) => this.onErrorUserFn(currentData, err));
    this.data.shift();
    this.onData();
  }
  constructor(onData: (data: T) => any, onError?: (data: T, err: any) => any) {
    this.onDataUserFn = onData;
    this.onErrorUserFn = onError ?? (() => {});
  }
  add(data: T) {
    this.data.push(data);
    if (this.data.length === 1) this.onData();
  }
}