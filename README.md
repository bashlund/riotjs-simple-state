# riotjs-simple-state

A straight forward centralized state management system for RiotJS in ~150 lines of TypeScript.

There are two different types of shared objects:  

1. Serializable shared objects used with `publish(), load(), watch(), delete()`.
    These objects can traverse window/CPU boundaries if you make them and they follow
    a publish/subscribe pattern.
    This is the common case of working with shared objects.

2. Any non necessarily serializable object set on the `.ref` object.
    These objects are just as they are and can be used for singleton type of uses cases
    such as shared database connection instances, etc.

## Installation

```sh
npm i riotjs-simple-state
```

## Setup

There are two ways of instantiating the `StateController`. Either use the global instance or instantiate it yourself and share that objects as you see fit.

### 1. Use the global instance

```js
import {
    stateController,  // note: lower-case "s", this is an instance.
} from "riotjs-simple-state";
```

This is a ready to use StateController instance shared across your app.

Note that this option does not rely on `riotjs` and can be used in plain JS/TS.

### 2. Instantiate yourself

In `main.js`:

```js
import {StateController} from "riotjs-simple-state";

const stateController = new StateController();

riot.install(function(component) {
    component.stateController = stateController;
});
```

Now, every riotjs component will have the `stateController` object accessible  as `this.stateController`.

## Usage

One of your components must create the state, then any component can retrieve the state and update the state.

Note that all objects must be serializable and cannot contain class instances of any kind.

```js
// It is generally advised to deal with state creation and loading/watching using onMounted,
// and not onBeforeMount.
// This is to avoid tricky situations where components who have not yet mounted are updated by riot
// which leads to unexpected behaviour.
//
onMounted(props, state) {
    // Create state on before mount so it is existing prior to initing child components.
    //
    this.stateController.create("myState", {a: 1});

    // watch can be done in same component creating the state and/or in any other component using the state.
    //
    this.stateController.watch("myState", myState => {
        this.myState = myState;
        this.update();
    );

    // or to only load the state once, do:
    //
    this.stateController.load("myState").then( myState => {
        this.myState = myState;

        this.update();
    }
}

onUnmounted(props, state) {
    // delete state on unmount so that child components are already unmounted.
    //
    this.stateController.delete("myState");
}

// At some point you want to share the updated state with other components interested, do:
//
this.stateController.publish("myState", this.myState);

// the `.ref` can be be used to share data without publishing it.
// An object set on `.ref` can be any object or instance, it will never be
// serialized like other shared objects will.
// Features such as watch() cannot be used with `.ref`.
//
this.stateController.ref.databaseConnection.fetch(...);
```

A good practice is to only allow one writer for each state. But it is OK to have multiple writers,
however the programmer must make sure there are no concurrent updates ofr the state since that is
a race condition which can give unexpected results. Also, make sure that changes to state is made
to latest state object retrieved by load() or watch().
