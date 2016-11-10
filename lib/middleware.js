'use strict';var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};var _formidable=require('formidable');var _formidable2=_interopRequireDefault(_formidable);var _fsExtra=require('fs-extra');var _fsExtra2=_interopRequireDefault(_fsExtra);var _util=require('util');var _util2=_interopRequireDefault(_util);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function applyRules(shape,rules){var response=rules?rules:shape;if(rules){for(var key in shape){if(_typeof(shape[key])==='object'){if(!response.hasOwnProperty(key)){response[key]=shape[key];}applyRules(shape[key],response[key]);}else if(!response[key]&&typeof response[key]!=='boolean'){response[key]=shape[key];}}}for(var type in response){if(response.hasOwnProperty(type)){for(var _key in response[type].resolvers){if(response[type].resolvers.hasOwnProperty(_key)&&typeof response[type].resolvers[_key].allowed==='boolean'&&!response[type].resolvers[_key].allowed){delete response[type].resolvers[_key];}}}}return response;}function resolveInputType(scalarType){switch(scalarType||scalarType.slice(0,-1)){case'Int':return'number';case'Float':return'number';case'Boolean':return'checkbox';case'String':return'text';default:return'text';}}function resolveInputControl(scalarType){switch(scalarType||scalarType.slice(0,-1)){case'Int':return'input';case'Float':return'input';case'Boolean':return'input';case'String':return'input';default:return'input';}}function getResolverName(typeName,method,rules){var resolverName='';if(rules&&rules[typeName]&&rules[typeName].resolvers&&rules[typeName].resolvers[method]&&rules[typeName].resolvers[method].resolver){resolverName=rules[typeName].resolvers[method].resolver;}else{resolverName=typeName+'_'+method;}return resolverName;}function findResolverArgs(typeName,method,array,rules){var args={},tmpObj={};if(rules&&rules[typeName]&&rules[typeName].resolvers&&rules[typeName].resolvers[method]&&rules[typeName].resolvers[method].resolver){tmpObj=array.find(function(obj){return obj.name.value===rules[typeName].resolvers[method].resolver;});}else{tmpObj=array.find(function(obj){return obj.name.value===typeName+'_'+method;});}if(tmpObj&&tmpObj.arguments){tmpObj.arguments.forEach(function(argObj){var type=argObj.type.kind==='NonNullType'?argObj.type.type.name.value+'!':argObj.type.name.value;args[argObj.name.value]=type;});}return args;}function checkMethodPermission(typeName,method,mutations,rules){var hasMethod=mutations.fields.find(function(obj){return obj.name.value===typeName+'_'+method;})?true:false;if(hasMethod&&rules&&rules[typeName]&&rules[typeName].resolvers&&rules[typeName].resolvers[method]&&(rules[typeName].resolvers[method].allowed||typeof rules[typeName].resolvers[method].allowed==='boolean')){hasMethod=rules[typeName].resolvers[method].allowed;}return hasMethod;}function getListHeader(shape){for(var key in shape){if(shape.hasOwnProperty(key)){var id=Object.keys(shape[key].fields).find(function(key){return key==='id'||key==='_id';}),title=Object.keys(shape[key].fields)[1];shape[key].listHeader={id:[id],title:[title]};}}}function hasNestedFields(propType){switch(propType.toLowerCase()){case'boolean':return false;case'string':return false;case'int':return false;case'float':return false;case'number':return false;default:return true;}}function getTypeListData(schema,propTypeName,rules){var Queries=schema.definitions.find(function(obj){return obj.name.value==='Query';}),Mutations=schema.definitions.find(function(obj){return obj.name.value==='Mutation';});return{label:false,propTypeName:propTypeName,resolvers:{find:{resolver:getResolverName(propTypeName,'find',rules),args:findResolverArgs(propTypeName,'find',Queries.fields,rules)},create:{resolver:getResolverName(propTypeName,'create',rules),args:findResolverArgs(propTypeName,'create',Mutations.fields,rules)}}};}function isListOfType(typeValue){switch(typeValue){case'Int':return false;case'Float':return false;case'Boolean':return false;case'String':return false;default:return true;}}function getFields(schema,typeName,rules){var typeObject=schema.definitions.find(function(obj){return obj.name.value===typeName;}),result={};typeObject.fields.forEach(function(prop){if(prop&&prop.type&&prop.type.kind!=='ListType'){if(prop.name&&prop.name.value&&prop.type.name&&prop.type.name.value){if(prop.name.value!=='Mutation'&&prop.name.value!=='Query'){result[prop.name.value]={label:prop.name.value,fieldType:prop.type.name.value,inputType:hasNestedFields(prop.type.name.value)?'String':resolveInputType(prop.type.name.value),inputControl:resolveInputControl(prop.type.name.value),disabled:false,exclude:false,list:false,nestedFields:hasNestedFields(prop.type.name.value)?getFields(schema,prop.type.name.value):false};}}}else if(prop&&prop.type&&prop.type.type&&prop.type.type.name&&prop.type.type.name.value&&isListOfType(prop.type.type.name.value)){result[prop.name.value]={label:prop.name.value,fieldType:prop.type.type.name.value,inputType:false,inputControl:'selection',disabled:false,exclude:false,list:getTypeListData(schema,prop.type.type.name.value,rules),nestedFields:getFields(schema,prop.type.type.name.value)};}});return result;}function fixPath(string){var result='';string.slice(0,1)==='/'||string.slice(0,1)==='.'?result=string:result='/'+string;result.slice(-1)==='/'?result=result.slice(0,-1):null;return result;}module.exports=function(config){var _require=require('graphql'),parse=_require.parse;var schema=config.schema?parse(config.schema):false;var rules=config.rules?config.rules:false;var exclude=config.exclude?config.exclude:false;var uploadRoot=config.uploadRoot?fixPath(config.uploadRoot):false;if(!schema){console.log('you have to provide your PRINTED schema in config object "{schema: myPrintedSchema}"');return;}return function(req,res){if(req.method.toLowerCase()==='get'){var Mutations=schema.definitions.find(function(obj){return obj.name.value==='Mutation';});var Queries=schema.definitions.find(function(obj){return obj.name.value==='Query';});var shape={};Queries.fields.forEach(function(method){var methodTypeName=method.type&&method.type.type&&method.type.type.name&&method.type.type.name.value?method.type.type.name.value:false;if(methodTypeName&&Mutations.fields.find(function(obj){return obj.name.value.split('_')[0]===methodTypeName;})&&(!exclude||!exclude.find(function(type){return type===methodTypeName;}))){shape[methodTypeName]={label:methodTypeName,listHeader:false,uploadRoot:uploadRoot,resolvers:{find:{resolver:getResolverName(methodTypeName,'find',rules),args:findResolverArgs(methodTypeName,'find',Queries.fields,rules),allowed:true},create:{resolver:getResolverName(methodTypeName,'create',rules),args:findResolverArgs(methodTypeName,'create',Mutations.fields,rules),allowed:checkMethodPermission(methodTypeName,'create',Mutations,rules)},update:{resolver:getResolverName(methodTypeName,'update',rules),args:findResolverArgs(methodTypeName,'update',Mutations.fields,rules),allowed:checkMethodPermission(methodTypeName,'update',Mutations,rules)},remove:{resolver:getResolverName(methodTypeName,'remove',rules),args:findResolverArgs(methodTypeName,'remove',Mutations.fields,rules),allowed:checkMethodPermission(methodTypeName,'remove',Mutations,rules)}},fields:getFields(schema,methodTypeName,rules)};}});getListHeader(shape);res.send(applyRules(shape,rules));}else if(req.method.toLowerCase()==='post'){var form=new _formidable2.default.IncomingForm();form.parse(req,function(err,fields,files){res.end(_util2.default.inspect({fields:fields,files:files}));});form.on('error',function(err){return console.error(err);});form.on('end',function(){var tempPath=this.openedFiles[0].path;var fileName=this.openedFiles[0].name.split(',')[0];var folderPath=fixPath(this.openedFiles[0].name.split(',')[1]);_fsExtra2.default.copy(tempPath,''+uploadRoot+folderPath+'/'+fileName,function(err){return err?console.error(err):null;});});}};};