"use strict";
const babylon = require('babylon');

let t, defaultMsg = '""';

const constructorVisitor = {
    ClassMethod( path ) {
        if ( path.node.key.name === 'constructor' ) {
            let arg = path.node.params[0];
            if ( t.isAssignmentPattern(arg) ) {
                defaultMsg = arg.right.extra.raw;
            }
        }
    }
};

module.exports = babel => {
    t = babel.types;
    return {
        visitor: {
            ClassDeclaration( path ) {
                if ( path.node.superClass && path.node.superClass.name === 'Error' ) {
                    let classname = path.node.id.name;
                    path.traverse(constructorVisitor);
                    let ast = babylon.parse(`
                        function ${classname}( message ) {
                            message = message || ${defaultMsg};

                            Error.call(this);
                            this.message = message;

                            if ( Error.hasOwnProperty('captureStackTrace') ) {
                                Error.captureStackTrace(this, this.constructor);
                            } else {
                                this.stack = (new Error(message)).stack;
                            }
                        }
                        ${classname}.prototype = new Error();
                    `);
                    path.replaceWithMultiple(ast.program.body);
                }
            }
        }
    }
};
