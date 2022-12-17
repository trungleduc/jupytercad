from typing import Dict, Type

from ..base_prop import BaseProp
from .geomcircle import Part_GeomCircle

geom_handlers: Dict[str, Type[BaseProp]] = {}

geom_handlers[Part_GeomCircle.name()] = Part_GeomCircle