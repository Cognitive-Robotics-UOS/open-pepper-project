"""
stk.services.py

Syntactic sugar for accessing NAOqi services.
"""

__version__ = "0.1.2" # mutated: replace_service

__copyright__ = "Copyright 2015, Aldebaran Robotics"
__author__ = 'ekroeger'
__email__ = 'ekroeger@aldebaran.com'


class ServiceCache(object):
    "A helper for accessing NAOqi services."

    def __init__(self, session=None):
        self.session = None
        self.services = {}
        self.replacements = {}
        if session:
            self.init(session)

    def init(self, session):
        "Sets the session object, if it wasn't passed to constructor."
        self.session = session
        
    def replace_service(self, servicename, replacername):
        """Replace a service by another (only for calls through this object).
        
        Can be useful for:
         - a workaround for a bug when connecting to remoe service, especially
           ALTabletService
         - Replacing a system service with a mock one for tests.
        """
        if getattr(self, replacername):
            self.replacements[servicename] = replacername
        # otherwise, the replacement service is not present, don't replace.

    def __getattr__(self, servicename):
        "We overload this so (instance).ALMotion returns the service, or None."
        if servicename in self.replacements:
            servicename = self.replacements[servicename]
        if (not servicename in self.services) or (
                servicename == "ALTabletService"):
            # ugly hack: never cache ALtabletService, always ask for a new one
            try:
                self.services[servicename] = self.session.service(servicename)
            except RuntimeError: # Cannot find service
                self.services[servicename] = None
        return self.services[servicename]
