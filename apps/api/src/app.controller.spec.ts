import { Test } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AvailabilityGrpcClient } from './common/availability/availability-grpc.client'

describe('AppController', () => {
  let controller: AppController
  const availability = {
    getAvailability: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: AvailabilityGrpcClient, useValue: availability },
      ],
    }).compile()

    controller = module.get(AppController)
  })

  it('invokes the availability service with correlation metadata', async () => {
    availability.getAvailability.mockResolvedValueOnce({ items: [] })

    await expect(
      controller.getAvailability('space-1,space-2', 'correlation-1'),
    ).resolves.toEqual({ items: [] })
    expect(availability.getAvailability).toHaveBeenCalledWith(
      ['space-1', 'space-2'],
      'correlation-1',
    )
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
