import { describe, it } from '@std/bdd';
import { expect } from '@std/expect';
import Signal from '~/messenger/services/signal.service.ts';

describe('messenger', () => {
  type Events = {
    test: { name: string }
  }

  const signal = new Signal<Events>() 
  const toDispatch = () => {}

  it('signal subscribe', () => {
    signal.subscribe('test', toDispatch)

    expect(signal.listeners['test']).toHaveLength(1);
  });

  it('signal unsubscribe', () => {
    signal.unsubscribe('test', toDispatch)

    expect(signal.listeners['test']).toHaveLength(0);
  });

  it('signal dispatch', async () => {
    let hasBeenCalled = false
    signal.subscribe('test', () => { hasBeenCalled = true })
    await signal.dispatch('test', { name: 'test' })
    
    expect(hasBeenCalled).toEqual(true)
  })

});