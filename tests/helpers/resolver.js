import Resolver from '../../resolver';
import config from '../../config/environment';
import modelCustomizations from 'ember-managed-relationships/model-customization';

const resolver = Resolver.create();

resolver.namespace = {
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix
};

    
modelCustomizations();

export default resolver;
