import os
import shutil
import kagglehub

# Download the latest version of the dataset from Kaggle
downloaded_path = kagglehub.dataset_download("paultimothymooney/chest-xray-pneumonia")
print(f"Dataset downloaded to: {downloaded_path}")

# Locate the folder containing train, val, and test
source_dir = os.path.join(downloaded_path, "chest_xray")
target_dir = "data"

# Copy to the local 'data/' directory
if not os.path.exists(target_dir):
    shutil.copytree(source_dir, target_dir)
    print(f"Dataset ready in ./{target_dir}")
else:
    print(f"Directory ./{target_dir} already exists.")