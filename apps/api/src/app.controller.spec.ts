import { Test } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let controller: AppController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    controller = module.get(AppController)
  })

  it('reports the API greeting', () => {
    expect(controller.getHello()).toBe('Hello World!')
  })

  it('reports a healthy service', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'api',
      timestamp: expect.any(String),
    })
  })
})
