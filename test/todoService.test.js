import { describe, it, beforeEach, before, after, afterEach } from 'node:test'
import assert from 'node:assert'
import crypto from 'node:crypto'
import TodoService from '../src/todoService.js'
import Todo from '../src/todo.js'
import sinon from 'sinon'

describe('todoService test Suite', () => {
    describe('#list', () => {
        let todoService
        let dependencies

        const mockDatabase = [{
            text: 'Eu estou aprendendo teste unitario',
            when: new Date(),
            status: 'now',
            id: '2804ecc6-1867-4f0b-8f25-42e9365d545g'
        }]

        beforeEach((context) => {
            dependencies = {
                todoRepository: {
                    list: context.mock.fn(async () => mockDatabase)
                }
            }
            todoService = new TodoService(dependencies)
        })
        
        it('poderia retornar uma lista de itens em caixa alta', async () => {
            const expected = mockDatabase
                .map(({ text, ...result }) => (new Todo({ text: text.toUpperCase(), ...result })))

            const result = await todoService.list()
            assert.deepStrictEqual(result, expected)

            const fnMock = dependencies.todoRepository.list.mock
            assert.strictEqual(fnMock.callCount(), 1)
        })
    })

    describe('#create', () => {
        let todoService
        let dependences
        let sandBox

        const mockCreateResult = {
            text: 'I must plan my trip to Europe',
            when: new Date(),
            status: 'late',
            id: '3a094da2-9421-4a8f-b3d3-e0a1e55b8ad2'
        }

        const def_id = mockCreateResult.id

        before((context) => {
            crypto.randomUUID = () => def_id
            sandBox = sinon.createSandbox()
        })
        
        after(async () => {
            crypto.randomUUID = (await import('node:crypto')).randomUUID
        })

        afterEach(() => sandBox.restore())

        beforeEach((context) => {
            dependences = {
                todoRepository: {
                    create: context.mock.fn(async () => mockCreateResult)
                }
            }

            todoService = new TodoService(dependences)
        })

        it('não poderia salvar o item com data invalida', async () => {
            const input = new Todo({
                text: '',
                when: ''
            })

            const expected = {
                error: {
                    message: 'invalid data',
                    data: {
                        text: '',
                        when: '',
                        status: '',
                        id: def_id
                    }
                }
            }

            const result = await todoService.create(input)

            assert.deepStrictEqual(JSON.stringify(result), JSON.stringify(expected))
        })

        it('poderia salvar todo item com status quando a propriedade é futuro do que hoje',
            async () => {
                const properties = {
                    text: 'Eu planejo uma viagem a europa',
                    when: new Date('2020-12-01 12:00:00 GMT-0')
                }
                
                const input = new Todo(properties)

                const expected = {
                    ...properties,
                    status: 'late',
                    id: def_id
                }
                
                const today = new Date('2020-12-02')
                sandBox.useFakeTimers(today.getTime())

                await todoService.create(input)

                const fnMock = dependences.todoRepository.create.mock
                assert.strictEqual(fnMock.callCount(), 1)

                assert.deepStrictEqual(fnMock.calls[0].arguments[0], expected)
            }
        )

        it('poderia salvar todo item com status quando a propriedade é passado do que hoje',
            async () => {
                const properties = {
                    text: 'Eu planejo uma viagem a europa',
                    when: new Date('2020-12-02 12:00:00 GMT-0')
                }
                
                const input = new Todo(properties)

                const expected = {
                    ...properties,
                    status: 'pending',
                    id: def_id
                }
                
                const today = new Date('2020-12-01')
                sandBox.useFakeTimers(today.getTime())

                await todoService.create(input)

                const fnMock = dependences.todoRepository.create.mock
                assert.strictEqual(fnMock.callCount(), 1)

                assert.deepStrictEqual(fnMock.calls[0].arguments[0], expected)
            }
        )
    })
})