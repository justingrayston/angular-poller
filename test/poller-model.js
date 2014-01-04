'use strict';

describe('Poller service', function () {

    describe('Poller model', function () {

        var $resource, $timeout, $httpBackend, poller, resource1, resource2, poller1, poller2, result1, result2;

        beforeEach(function () {
            module('poller');
            module('ngResource');
        });

        beforeEach(inject(function ($injector) {
            $resource = $injector.get('$resource');
            $timeout = $injector.get('$timeout');
            $httpBackend = $injector.get('$httpBackend');
            poller = $injector.get('poller');
        }));

        beforeEach(function () {

            // Basic poller
            resource1 = $resource('/users');
            $httpBackend.expect('GET', '/users').respond([
                {id: 123, name: 'Alice'},
                {id: 456, name: 'Bob'}
            ]);
            poller1 = poller.get(resource1);
            poller1.promise.then(null, null, function (data) {
                result1 = data;
            });

            // Advanced poller
            resource2 = $resource('/user');
            $httpBackend.expect('GET', '/user?id=123').respond(
                {id: 123, name: 'Alice'}
            );
            poller2 = poller.get(resource2, {
                action: 'get',
                delay: 6000,
                params: {
                    id: 123
                }
            });
            poller2.promise.then(null, null, function (data) {
                result2 = data;
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            poller.reset();
        });

        it('Should have resource property', function () {
            expect(poller1).to.have.property('resource').to.equal(resource1);
        });

        it('Should have default action property - query', function () {
            expect(poller1).to.have.property('action').to.equal('query');
        });

        it('Should have customized action if it is specified', function () {
            expect(poller2).to.have.property('action').to.equal('get');
        });

        it('Should have default delay property - 5000', function () {
            expect(poller1).to.have.property('delay').to.equal(5000);
        });

        it('Should have customized delay if it is specified', function () {
            expect(poller2).to.have.property('delay').to.equal(6000);
        });

        it('Should have default params property - empty object', function () {
            expect(poller1).to.have.property('params').to.deep.equal({});
        });

        it('Should have customized params if it is specified', function () {
            expect(poller2).to.have.property('params').to.have.property('id').to.equal(123);
        });

        it('Should maintain a copy of resource promise', function () {
            expect(poller1).to.have.property('promise');
        });

        it('Should maintain a timeout ID to manage polling', function () {
            expect(poller1).to.have.property('timeout').to.have.property('$$timeoutId');
        });

        it('Should stop polling and reset timeout ID on invoking stop()', function () {
            poller1.stop();
            expect(poller1.timeout.$$timeoutId).to.equal(null);
        });

        it('Should have correct data in callback', function () {
            expect(result1.length).to.equal(2);
            expect(result1[1].name).to.equal('Bob');

            expect(result2.id).to.equal(123);
            expect(result2.name).to.equal('Alice');
        });

        it('Should fetch resource every (delay) milliseconds', function () {
            $httpBackend.resetExpectations();
            $httpBackend.expect('GET', '/users').respond([
                {id: 123, name: 'Alice'},
                {id: 456, name: 'Bob'},
                {id: 789, name: 'Lucy'}
            ]);
            $httpBackend.expect('GET', '/user?id=123').respond(
                {id: 123, name: 'Alice', number: '456'}
            );
            $timeout.flush();
            $httpBackend.flush();

            expect(result1.length).to.equal(3);
            expect(result2).to.have.property('number');
        });
    });
});