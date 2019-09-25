import * as strongConfig from './index'

describe('strong-config exports are as expected', () => {
  it('exports a load function', () => {
    expect(strongConfig.load).toBeInstanceOf(Function)
  })

  it('exports a validate function', () => {
    expect(strongConfig.validate).toBeInstanceOf(Function)
  })
})
