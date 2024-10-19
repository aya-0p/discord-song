export class Queue<T> {
  private readonly data: Array<T> = [];
  private readonly onDataUserFn: (data: T) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly onErrorUserFn: (data: T, err: any) => Promise<void> | void;
  private async onData() {
    if (this.data.length === 0) return;
    const currentData = this.data[0];
    await this.onDataUserFn(currentData).catch((err) => this.onErrorUserFn(currentData, err));
    this.data.shift();
    void this.onData();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(onData: (data: T) => Promise<void>, onError?: (data: T, err: any) => Promise<void> | void) {
    this.onDataUserFn = onData;
    this.onErrorUserFn = onError ?? (() => {});
  }
  add(data: T) {
    this.data.push(data);
    if (this.data.length === 1) void this.onData();
  }
}
