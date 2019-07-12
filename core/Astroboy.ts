import chalk from 'chalk';
import * as path from 'path';
import * as Koa from 'koa';
import { EventEmitter } from 'events';
import { CoreLoader } from './CoreLoader';
import { IAstroboyOptions, IInnerApplication } from '../definitions/core';
import { IAstroboyContextDefine } from '../definitions';
import { IBaseContextDefine } from '../definitions/extends/context';

export class Astroboy<DEFINE extends Partial<IBaseContextDefine> = IAstroboyContextDefine> extends EventEmitter {
  protected app!: DEFINE['app'];
  protected options!: IAstroboyOptions;
  private loader!: CoreLoader<DEFINE['config'], any>;

  protected get [Symbol.for('BASE_DIR')]() {
    return path.join(__dirname, '..');
  }

  constructor(options: Partial<IAstroboyOptions> = {}) {
    super();
    options.NODE_ENV =
      process.env.APPLICATION_STANDARD_ENV || process.env.NODE_ENV || options.NODE_ENV || 'development';
    options.NODE_PORT = process.env.NODE_PORT || options.NODE_PORT || '8201';
    options.ROOT_PATH = options.ROOT_PATH || process.cwd();
    this.options = <IAstroboyOptions>options;

    this.init();
    this.start();
  }

  protected init() {
    this.app = <any>new Koa();
    this.app.env = this.options.NODE_ENV;
    (<IInnerApplication>(<unknown>this.app)).NODE_ENV = this.options.NODE_ENV;
    (<IInnerApplication>(<unknown>this.app)).ROOT_PATH = this.options.ROOT_PATH;
    (<IInnerApplication>(<unknown>this.app)).ROOT_NAME = path.basename(this.options.ROOT_PATH);

    this.loader = new CoreLoader<DEFINE['config'], any>({
      astroboy: this,
      app: this.app,
    });
  }

  private start() {
    this.app.listen(this.options.NODE_PORT, () => {
      console.log(chalk.green('应用启动成功'));
      console.log(chalk.green(`访问地址：${chalk.blue('http://127.0.0.1:' + this.options.NODE_PORT)}`));
      this.emit('start', this.app);
    });
    this.app.on('error', (err: any, ctx: DEFINE['ctx']) => {
      this.emit('error', err, ctx);
    });
    // 添加默认的 error 事件监听器
    setTimeout(() => {
      if (this.listenerCount('error') === 0) {
        this.on('error', (err, ctx) => {
          console.log('[default error callback]');
          console.log(err);
        });
      }
    }, 3000);
  }
}
