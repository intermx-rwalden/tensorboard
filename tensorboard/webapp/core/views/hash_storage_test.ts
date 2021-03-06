/* Copyright 2019 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Store} from '@ngrx/store';
import {provideMockStore, MockStore} from '@ngrx/store/testing';
import {CommonModule} from '@angular/common';

import {getActivePlugin} from '../store';
import {State} from '../store/core_types';
import {pluginUrlHashChanged} from '../actions';

import {HashStorageContainer} from './hash_storage_container';
import {HashStorageComponent} from './hash_storage_component';

/** @typehack */ import * as _typeHackStore from '@ngrx/store';
/** @typehack */ import * as _typeHackStoreTesting from '@ngrx/store/testing';

describe('hash storage test', () => {
  let store: MockStore<State>;
  let dispatchSpy: jasmine.Spy;
  let setStringSpy: jasmine.Spy;
  let getStringSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, CommonModule],
      providers: [provideMockStore(), HashStorageContainer],
      declarations: [HashStorageContainer, HashStorageComponent],
    }).compileComponents();
    store = TestBed.get(Store);
    dispatchSpy = spyOn(store, 'dispatch');

    setStringSpy = jasmine.createSpy();
    getStringSpy = jasmine.createSpy();

    // Cannot safely stub out window.location.hash or rely on test framework
    // to not make use of the hash (it does).

    // Do not rely on Polymer bundle in the test.
    const createElement = spyOn(document, 'createElement');
    createElement.withArgs('tf-storage').and.returnValue({
      tf_storage: {
        setString: setStringSpy,
        getString: getStringSpy,
      },
    } as any);
    createElement.withArgs('tf-globals').and.returnValue({
      tf_globals: {
        setUseHash: jasmine.createSpy(),
      },
    } as any);
    createElement.and.callThrough();
  });

  it('sets the hash to plugin id by replacing on first load', () => {
    store.overrideSelector(getActivePlugin, 'foo');
    const fixture = TestBed.createComponent(HashStorageContainer);
    fixture.detectChanges();

    expect(setStringSpy).toHaveBeenCalledWith(jasmine.any(String), 'foo', {
      useLocationReplace: true,
    });
  });

  it('changes hash with new pluginId on subsequent changes', () => {
    store.overrideSelector(getActivePlugin, 'foo');
    const fixture = TestBed.createComponent(HashStorageContainer);
    fixture.detectChanges();
    getStringSpy.and.returnValue('foo');

    store.overrideSelector(getActivePlugin, 'bar');
    store.refreshState();
    fixture.detectChanges();

    expect(setStringSpy).toHaveBeenCalledTimes(2);
    expect(setStringSpy).toHaveBeenCalledWith(jasmine.any(String), 'bar', {});
  });

  it('dispatches plugin changed event when hash changes', () => {
    store.overrideSelector(getActivePlugin, 'foo');
    const fixture = TestBed.createComponent(HashStorageContainer);
    fixture.detectChanges();
    getStringSpy.and.returnValue('bar');

    window.dispatchEvent(new Event('hashchange'));
    expect(dispatchSpy).toHaveBeenCalledWith(
      pluginUrlHashChanged({plugin: 'bar'})
    );
  });
});
