import os

# Define directories that need __init__.py files
dirs = [
    "/home/primegusty/Documents/HackSpire1/saveme/model/src",
    "/home/primegusty/Documents/HackSpire1/saveme/model/src/api",
    "/home/primegusty/Documents/HackSpire1/saveme/model/src/utils",
    "/home/primegusty/Documents/HackSpire1/saveme/model/src/anomaly_detection",
    "/home/primegusty/Documents/HackSpire1/saveme/model/src/data_processing",
    "/home/primegusty/Documents/HackSpire1/saveme/model/src/visualization"
]

# Create __init__.py in each directory
for directory in dirs:
    init_file = os.path.join(directory, "__init__.py")
    if not os.path.exists(directory):
        print(f"Directory {directory} does not exist, skipping")
        continue
        
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            f.write("# This file is required to make Python treat this directory as a package\n")
        print(f"Created {init_file}")
    else:
        print(f"{init_file} already exists")
