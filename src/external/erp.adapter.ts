import { NetworkError, TimeoutError } from './exceptions.ts';

export interface CreateOrderData {
  orderId: string;
  amount: number;
}

export type SimulationMode = 'success' | 'error' | 'timeout';



export class ErpAdapter {
  private mode: SimulationMode;
  private timeoutLimit: number;

  constructor(mode: SimulationMode = 'success', timeoutLimit = 1500) {
    this.mode = mode;
    this.timeoutLimit = timeoutLimit;
  }

  async syncOrder(orderData: CreateOrderData): Promise<void> {
    console.log(`[ERP Adapter] Processing order ${orderData.orderId} [Mode: ${this.mode}]`);

    switch (this.mode) {
      case 'success':
        // Simula uma latência de rede normal (ex: 300ms)
        await this.delay(300);
        console.log(`[ERP Success] Order ${orderData.orderId} synchronized successfully.`);
        return;

      case 'error':
        // Simula uma falha no servidor externo (ex: HTTP 500 / 502)
        await this.delay(500);
        throw new NetworkError(`[ERP Error] External system rejected order ${orderData.orderId} (HTTP 502 Bad Gateway)`);

      case 'timeout':
        // Simula uma demora que ultrapassa o limite tolerado
        await this.delay(this.timeoutLimit + 500);
        throw new TimeoutError(`[ERP Timeout] Request timed out after ${this.timeoutLimit}ms for order ${orderData.orderId}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}